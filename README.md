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
| Attitude Sensor    | 10            | 342                         | 0.034 | 4        | 10 ms      |
| Inner-Loop Control | 20            | 13551                       | 0.678 | 3        | 20 ms      |
| Telemetry Packet   | 500           | 28471                       | 0.057 | 2        | 500 ms     |
| Logging            | 1000          | 60651                       | 0.061 | 1        | 1000 ms    |
| `radar_sem`        | Aperiodic     | 2718 (idle) / 2806 (loaded) | ----- | 12       | ISR-Driven |
| `radar_notif`      | Aperiodic     | 40 (idle) / 2509 (loaded)   | ----- | 12       | ISR-Driven |

Total utilization U = 0.83 (RM bound / EDF feasible: U = 0.829 is above the Rate-Monotonic sufficiency bound (0.757) but < 1.0. It's EDF-feasible but RM is not guaranteed.)

## Hazard analysis & standard mapping
<hazard, effect, mitigation; mapped to the standard clause>

## Graceful degradation
<what fails, how it is detected, what the system does instead>

## Build & run
<toolchain, board, how to reproduce>

## Tailored for
<target role> — <why these choices fit that role>
