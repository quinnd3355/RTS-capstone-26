# RTS-capstone-26
Final assignment (capstone) for Summer '26 Real Time Systems course.

<your theme sentence>

## Demo
- Video: <YouTube / Wokwi link>
- Live Wokwi: DUBRE-FINAL-RTS26Summer

## Architecture
<diagram + 2–3 sentences on the data/control flow>

## Tasks & timing (WCET evidence)
| Task               | Period T (ms) | WCET C                      | U=C/T | Priority | Deadline   |
|--------------------|--------------:|----------------------------:|------:|---------:|-----------:|
| Attitude Sensor    | 10            | 342                         | 0.034 | 15       | 10 ms      |
| Inner-Loop Control | 20            | 13551                       | 0.678 | 10       | 20 ms      |
| Telemetry Packet   | 500           | 28471                       | 0.057 | 5        | 500 ms     |
| Logging            | 1000          | 60651                       | 0.061 | 2        | 1000 ms    |
| `radar_sem`        | 30            | 2718 (idle) / 2806 (loaded) | ----- | 12       | 6 ms       |
| `radar_notif`      | 30            | 40 (idle) / 2509 (loaded)   | ----- | 12       | 6 ms       |
| `watchdog`         | 100           |                             |       | 4        | 100 ms     |
| `uav_beacon`       | 1000          |                             |       | 2        | 1000 ms    |

Total utilization U = 0.83 (RM bound / EDF feasible: U = 0.829 is above the Rate-Monotonic sufficiency bound (0.757) but < 1.0. It's EDF-feasible but RM is not guaranteed.)

RADAR bottom halves are sporadic, not periodic. 30 ms (`DEBOUNCE_US`) is used as a conservative minimum arrival time, standing in for period T in this table. Deadline does not equal period here (for `radar_sem` and `radar_notif`) on purpose. The `LATENCY_BUDGET_US` (set to 6 ms) is the system's response requirement, which is shorter than the 30 ms arrival floor. This makes the system a Deadline-Monotonic priority and not just a usual Rate-Monotonic scheduling system. In theory, priority should be scheduled by deadline and not period. In the table, this means RADAR (the sem and notif sections) should hold the highest priority; however, the code gives `load_a` (Attitude Sensor) the highest priority. This is to allow `load_a` to be the only task that can trip the latency watchdog under contention. 
The HTTP server task is excluded since it is aperiodic and pinned to Core 0.

## Hazard analysis & standard mapping
**Standard:** DO-178C, Software Considerations in Airborne Systems and Equipment Certification. This was chosen to match the target role: avionics. No DER view, no formal certification liaison process, and no independent verification team. 

| # | Hazard | Effect | Severity | Mitigation | DO-178C Mapping |
|---|-------:|-------:|---------:|-----------:|----------------:|
| 1 | Binary semaphore has no count; can drop a signal under burst input| RADAR echo detected but not reported | Hazardous | Redundant losses; hit counts cross-checked | Robustness/adverse condition testing |
| 2 | `isr_entry_time_us` is a single shared global overwritten every firing | Under burst input, a bottom-half task can compute latency against the wrong event | Major | Documented as a known race | Traceability of low-level requirements |
| 3 | `esp_timer_start_once()` called from ISR context is not documented as ISR-safe in ESP-IDF | Undefined behavior risk | Hazardous | Accepted as a known limitation | Guidance on previously developed software requiring additional verification when used outside its documented contract |
| 4 | Fixed debounce window sets a hard floor on minimum distinguishable echo spacing | Two genuine RADAR returns closer than 30 ms apart cannot be told apart | Major | Stated as a derived requirement/limitation | Derived requirements must be fed back to systems safety process | 
| 5 | RADAR ISR likely executes on a different core than the bottom-half tasks it wakes | Unmeasured, nonzero cross-core handoff latency | Major | Flagged for confirmation via `xPortGetCoreID()` | Timing analysis must account for all sources of latency contributing to WCET |
| 6 | Watchdog priority 94) sits below one background load task (`load_c` (5)) despite shorter period | Detect-to-degrade reaction time not currently bounded or measured | Minor-Major | Not yet resolved | Safety monitor timing itself is in scope for verification |
| 7 | Latency-max tracking is sticky, does not reset once budget is exceeded | System will not declare "recovered" even if latency improves | N/A, intentional | Explicitly designed as a fail-safe | Consistent with DO-178C's general preference for non-silent failure handling | 

## Graceful degradation
The latency watchdog (`watchdog_task`, priority 4) polls `max(latency_max_sem_us, latency_max_notif_us)` every 100 ms against `LATENCY_BUDGET_US` (6 ms, about 2x the idle max of 2718 us). Crossing the budget sets `beacon_enabled = false` and `system_degrade = true`. The non-critical UAV-01 beacon stops toggling while the RADAR path is untouched. The webpage shows a 'Degraded' banner in real time.
The tracked max latency is never reset, so once the system has been tripped, it stays degraded and does not self-declare healthy again. This was a deliberate choice for a safety-relevant system.

## Build & run
 - **Target:** ESP32-S3 (Wokwi), ESP-IDF builder
 - **Wokwi Project:** `DUBRE-FINAL-RTS26Summer`
 - **GPIOI Map:** 18 = button/RADAR echo (active-low, internal pull-up), 19 = scope pulse out (logic analyzer), 2 = beacon LED out
 - **Build Flags:** `WITH_LOAD` controls background load, `WITH_LOAD 0` for idle and `WITH_LOAD 1` for loaded runs

## Tailored for
This is tailored for an Avionics system software. The design choices were made against that lens. 
- The RADAR detection path is pinned to its own core and given priority over everything except `load_a` (deliberately chosen), so a non-critical feature could never delay a RADAR detection. This is a core expectation for flight-relative sensing.
- Graceful degradation sheds the non-critical system (beacon) first, never the RADAR path, and defaults to a fail-safe rather than a self-healing degraded state. This is expected in safety-relevant airborne software.
- The hazard analysis is specifically mapped to DO-178C.
