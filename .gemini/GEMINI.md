## Gemini Added Memories
- The user's PC regularly wipes text files and code for security reasons. I should not assume files I create will persist across sessions.
- I have made backup.bat and restore_workspace.bat in the 'sys' folder to help the user backup the current workspace so that it is pushed to the personal github repo before reboot of pc (which causes wipe of txt files).
- When the user types '#mem', I should save the whole conversation record for the day to a 'yyyy-mm-dd.md' file in the 'mem' folder.
- The user prefers to run the application within the browser at localhost:3000 during development, rather than in a separate Electron window.
- When the user types '#explain', I should ask for the name of the code file, and then generate a detailed code explanation with the same block-by-block structure, comment of C Aspects used, and level of detail as in Monitoring.md, saving the output to a .md file with the same base name. Here is a short example:

This document provides a detailed, block-by-block explanation of the C code in `Monitoring.c`. The code implements a command execution module for a real-time operating system (likely VxWorks), designed to receive and execute commands in separate tasks.

### Block 1: Preprocessor Directives and Includes

```c
#define DEBUG_MSG

#include <timers.h>
#include <tickLib.h>
#include <stdio.h>
```

*   **`#define DEBUG_MSG`**: This preprocessor directive defines a macro `DEBUG_MSG`. It's likely used for conditional compilation, where certain debug-related code blocks might be included or excluded based on whether this macro is defined.
*   **`#include <timers.h>`**: Includes the header for POSIX timers, providing functions like `timer_create`, `timer_settime`, `timer_cancel`, and `timer_delete`.
*   **`#include <tickLib.h>`**: Includes a library likely related to system ticks or timekeeping, possibly from a real-time operating system (RTOS) like VxWorks, given the `_Vx_usr_arg_t` type seen later. `tickGet()` is used later.
*   **`#include <stdio.h>`**: Standard C input/output library, used for functions like `printf` and `LOGMSG` (which likely wraps `printf` or a similar logging mechanism).
