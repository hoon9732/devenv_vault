This document provides a detailed, block-by-block explanation of the C code in `CmdExec.c`. The code implements a command execution module for a real-time operating system (likely VxWorks), designed to receive and execute commands in separate tasks.

### Block 1: Preprocessor Directives and Includes

```c
#define DEBUG_MSG

#include <vxworks.h>
#include <symLib.h>
#include <errnoLib.h>
#include <usrLib.h>
#include <string.h>
#include <ctype.h>

#include "../lib/util/isDebug.h"
#include "common.h"
#include "CmdExec.h"
#include "CmdFuncs.h"
#include "UdpSendOps.h"
```

*   **`#define DEBUG_MSG`**: This preprocessor directive is likely used to enable conditional compilation for debugging-related code, such as logging messages.
*   **`<vxworks.h>` and other system includes**: These headers are for the VxWorks RTOS. They provide core functionalities:
    *   `symLib.h`: For using symbol tables, which map names to memory addresses (used here to find functions by name).
    *   `errnoLib.h`: For handling system error codes.
    *   `usrLib.h`: For various user-level utility functions.
*   **Standard C Includes**: `string.h` (for string manipulation) and `ctype.h` (for character type functions like `isspace`).
*   **Project-Specific Includes**: These headers link to other parts of the project:
    *   `isDebug.h`: Utility for debugging.
    *   `common.h`: Common definitions for the project.
    *   `CmdExec.h`: The header file for this module.
    *   `CmdFuncs.h`: Declarations for the functions that can be executed as commands.
    *   `UdpSendOps.h`: Functions for sending results or status via UDP.

**C Aspects Used**:
*   **Preprocessor directives**: `#define` for macro definition, `#include` for incorporating header files.
*   **Standard C libraries**: `string.h` for string manipulation functions (e.g., `strlen`, `strcpy`, `strtok`, `memset`, `strcmp`, `memcpy`), `ctype.h` for character classification functions (e.g., `isspace`).
*   **System-specific libraries**: VxWorks RTOS headers (`vxworks.h`, `symLib.h`, `errnoLib.h`, `usrLib.h`) for real-time operating system services.

### Block 2: Constants and `CmdExecState` Enum

```c
#define CMD_EXEC_MSG_Q_LEN      (20)
#define CMD_TBL_POOL_SIZE       (4096)
#define CMD_TBL_ITEM(x)         { #x, x }

typedef enum {
    RUNNING,
    STOP
} CmdExecState;
```

*   **`CMD_EXEC_MSG_Q_LEN (20)`**: Defines the capacity of the message queue that receives incoming commands (up to 20 messages).
*   **`CMD_TBL_POOL_SIZE (4096)`**: Allocates 4KB of memory to be used for the symbol table that stores the commands.
*   **`CMD_TBL_ITEM(x)`**: A convenient macro to create entries for the command table. It takes a function name `x` and generates a structure containing its name as a string (`#x`) and its address as a function pointer (`x`). The `#` operator is a preprocessor stringification operator.
*   **`CmdExecState`**: An `enum` that defines the two possible operational states of the module: `RUNNING` (able to execute commands) and `STOP` (execution is paused).

**C Aspects Used**:
*   **Preprocessor directives**: `#define` for defining constants and function-like macros. The `#` operator for stringification within a macro.
*   **Enumerations**: `typedef enum` for creating a custom enumeration type, providing a set of named integer constants.

### Block 3: Data Structures

```c
typedef struct {
    TASK_ID         taskId;
    ModuleType      ipcType;
    union {
        MSG_Q_ID    msgQId;
        int         pipeFd;
        int         quitFlag;
    } ipcObj;
    char            deferredWorkName[32];
#ifdef USE_CHK_TASK_STATUS
    TaskStatus *    taskStatus;
#endif
    CmdExecState    state;
    PART_ID         cmdPoolId;
    SYMTAB_ID       cmdTblId;
    TASK_ID         tidCmdExec;
} CmdExecInst;

typedef struct tagCmdTblItem {
    char *          name;
    FUNCPTR         pfn;
} CMD_TBL_ITEM;
```

*   **`CmdExecInst`**: This is the primary structure that holds all the runtime data for a command execution instance.
    *   `taskId`: The ID of the main `CmdExec` task itself.
    *   `ipcType`, `ipcObj`: Defines the Inter-Process Communication (IPC) method. The `union` allows it to hold an ID for a message queue, a pipe, or a simple flag.
    *   `state`: The current `CmdExecState` (`RUNNING` or `STOP`).
    *   `cmdPoolId`: The ID of the memory partition created for the symbol table.
    *   `cmdTblId`: The ID of the symbol table used to look up commands.
    *   `tidCmdExec`: The Task ID of the specific command function that has been spawned for execution. This is used to stop a running command.
*   **`CMD_TBL_ITEM`**: The structure that defines an entry in the command table, pairing a command's `name` (string) with its function pointer `pfn`.

**C Aspects Used**:
*   **Structures**: `typedef struct` for defining custom aggregate data types, encapsulating related data members.
*   **Unions**: `union` for memory-efficient storage of mutually exclusive data members, where only one member is active at a time.
*   **Pointers**: `TaskStatus *taskStatus`, `char *name`, `FUNCPTR pfn` for referencing memory locations and functions.
*   **Arrays**: `char deferredWorkName[32]` for fixed-size character arrays (strings).
*   **Conditional compilation**: `#ifdef`, `#endif` to conditionally include or exclude code based on macro definitions.
*   **Custom types**: `TASK_ID`, `ModuleType`, `MSG_Q_ID`, `PART_ID`, `SYMTAB_ID`, `FUNCPTR` are likely `typedef`s for underlying integer or pointer types, common in RTOS environments.

### Block 4: Global Variables and Command Table Definition

```c
LOCAL CmdExecInst g_stCmdExecInst = {
    TASK_ID_ERROR, MSGQ, {MSG_Q_ID_NULL}, "",
};

LOCAL char g_cmdTblPool[CMD_TBL_POOL_SIZE];

LOCAL CMD_TBL_ITEM g_cmdTblItems[] = {
    CMD_TBL_ITEM(mtsTestFunc),
    CMD_TBL_ITEM(invokeMethod_uint),
    // ... many more command entries ...
    CMD_TBL_ITEM(mtsTaDataInputStop),
};

LOCAL int g_numCmdFunc = NELEMENTS(g_cmdTblItems);
LOCAL int g_numCmdFuncAdded = 0;

const ModuleInst *g_hCmdExec = (ModuleInst *)&g_stCmdExecInst;

char            g_szArgs[GUI_CMD_ARG_MAX_NUM][GUI_CMD_ARG_MAX_SIZE];
UINT32          g_dwArgMask = UINT32_MAX;
```

*   **`g_stCmdExecInst`**: A `static` (`LOCAL`) global instance of the `CmdExecInst` structure, initialized with default values. This holds the module's state.
*   **`g_cmdTblPool`**: A 4KB character array that provides the raw memory for the symbol table's memory partition.
*   **`g_cmdTblItems[]`**: The main command table. This is an array of `CMD_TBL_ITEM` structs, populated using the `CMD_TBL_ITEM` macro. It defines every function that can be executed by this module.
*   **`g_numCmdFunc`, `g_numCmdFuncAdded`**: Globals to track the total number of commands and how many were successfully added to the symbol table.
*   **`g_hCmdExec`**: A generic handle to the module instance, allowing other parts of the system to interact with it without needing to know the specific `CmdExecInst` type.
*   **`g_szArgs`, `g_dwArgMask`**: Global variables for storing parsed command arguments. This is a common but potentially unsafe practice in multitasking environments; it implies that only one command's arguments are handled at a time.

**C Aspects Used**:
*   **Global variables**: Variables declared outside any function, accessible throughout the file.
*   **Static storage duration**: The `LOCAL` macro (likely `static`) gives variables internal linkage, limiting their visibility to the current translation unit.
*   **Arrays**: `g_cmdTblPool`, `g_cmdTblItems[]`, `g_szArgs[][]` for storing collections of data.
*   **Structure initialization**: Initializing `g_stCmdExecInst` with a list of values.
*   **Pointers**: `const ModuleInst *g_hCmdExec`, `char *` for `g_szArgs` (implicitly, as a 2D array of characters).
*   **Type casting**: `(ModuleInst *)&g_stCmdExecInst` to cast the address of `g_stCmdExecInst` to a pointer of type `ModuleInst *`.
*   **Constants**: `UINT32_MAX` for a maximum unsigned 32-bit integer value.

### Block 5: Function Prototypes

```c
LOCAL STATUS    InitCmdExec(CmdExecInst *this);
LOCAL STATUS    FinalizeCmdExec(CmdExecInst *this);
LOCAL STATUS    ExecuteCmdExec(CmdExecInst *this);

LOCAL void      OnStart(CmdExecInst *this);
LOCAL void      OnStop(CmdExecInst *this);
LOCAL STATUS    OnExecute(CmdExecInst *this, OPS_TYPE_TEST_CONTROL *pTestControl);

LOCAL void      removeBlank(char *szArg);
LOCAL STATUS    setArgMask(char *szArg);
LOCAL STATUS    parseArgs(char *szArg);

LOCAL STATUS    startCmd(CmdExecInst *this, char *szCmd, char *szArg);
LOCAL STATUS    stopCmd(CmdExecInst *this);
```

*   These are forward declarations for all the `static` (`LOCAL`) functions defined within this file. This allows them to be called before their full implementation appears in the source code.

**C Aspects Used**:
*   **Function declarations (prototypes)**: Declaring functions before their definitions, specifying their return type, name, and parameters.
*   **Pointers as function arguments**: `CmdExecInst *this`, `OPS_TYPE_TEST_CONTROL *pTestControl`, `char *szArg`, `char *szCmd` for passing addresses of structures and strings.
*   **Custom types**: `STATUS`, `CmdExecInst`, `OPS_TYPE_TEST_CONTROL` are used as return types and parameter types.
*   **Static linkage**: The `LOCAL` macro (likely `static`) ensures these functions are only visible within this `.c` file.

### Block 6: `InitCmdExec` Function

```c
LOCAL STATUS InitCmdExec(CmdExecInst *this) {
    this->taskId = taskIdSelf();
    this->state = STOP;
    this->cmdPoolId = NULL;
    this->cmdTblId = NULL;
    this->tidCmdExec = TASK_ID_NULL;
    g_numCmdFuncAdded = 0;

    this->ipcObj.msgQId = msgQCreate(CMD_EXEC_MSG_Q_LEN,
                                    sizeof(CmdExecMsg), MSG_Q_FIFO);
    if (!(this->ipcObj.msgQId)) {
        LOGMSG("Message Q Creation Fail!\n");
        return ERROR;
    }

    this->cmdPoolId = memPartCreate((char *)g_cmdTblPool, CMD_TBL_POOL_SIZE);
    if(this->cmdPoolId == NULL) {
        LOGMSG("MemPart Creation Fail! (errNo: 0x%08X)\n", errnoGet());
        printErrno(errnoGet());
        return ERROR;
    }

    this->cmdTblId = symTblCreate(7, FALSE, this->cmdPoolId);
    if(this->cmdTblId == NULL) {
        LOGMSG("SymTbl Creation Fail! (errNo: 0x%08X)\n", errnoGet());
        printErrno(errnoGet());
        return ERROR;
    }

    int i;
    for (i = 0; i < g_numCmdFunc; i++) {
        if (symAdd(this->cmdTblId, g_cmdTblItems[i].name, (SYM_VALUE)g_cmdTblItems[i].pfn,
                    SYM_GLOBAL | SYM_TEXT, 1) == ERROR) {
            LOGMSG("symAdd() error! (errNo: 0x%08X)\n", errnoGet());
            printErrno(errnoGet());

            g_numCmdFuncAdded = i + 1;

            return ERROR;
        }
    }

    g_numCmdFuncAdded = i;

    return OK;
}
```

*   This function initializes all the resources needed for the module to run.
    1.  It sets the initial state to `STOP`.
    2.  It creates a message queue (`msgQCreate`) for receiving commands.
    3.  It creates a memory partition (`memPartCreate`) from the `g_cmdTblPool` global array.
    4.  It creates a symbol table (`symTblCreate`) using that memory partition.
    5.  It iterates through the `g_cmdTblItems` array and adds each command name and function pointer to the symbol table using `symAdd`. This makes the functions searchable by name at runtime.

**C Aspects Used**:
*   **Function definition**: Defining the `InitCmdExec` function.
*   **Pointers and structure member access**: `this->taskId`, `this->state`, `this->ipcObj.msgQId` using the `->` operator to access members of a structure pointed to by `this`.
*   **Assignment operators**: `=` for assigning values.
*   **Function calls**: `taskIdSelf()`, `msgQCreate()`, `memPartCreate()`, `symTblCreate()`, `symAdd()`, `LOGMSG()`, `errnoGet()`, `printErrno()`.
*   **Conditional statements**: `if` statements for error checking and control flow.
*   **Return statements**: `return OK` or `return ERROR` to indicate success or failure.
*   **Loops**: `for` loop to iterate through the command table items.
*   **Type casting**: `(char *)g_cmdTblPool`, `(SYM_VALUE)g_cmdTblItems[i].pfn` to convert between pointer types.
*   **`sizeof` operator**: Used to determine the size of `CmdExecMsg`.
*   **Logical operators**: `!` for negation in `if (!(this->ipcObj.msgQId))`.
*   **Bitwise OR operator**: `SYM_GLOBAL | SYM_TEXT` for combining flags.

### Block 7: `FinalizeCmdExec` Function

```c
LOCAL STATUS FinalizeCmdExec(CmdExecInst *this) {
    STATUS nRet = OK;
    if(this->ipcObj.msgQId) {
        if (msgQDelete(this->ipcObj.msgQId)) {
            LOGMSG("msgQDelete() error!\n");
            nRet = ERROR;
        } else {
            this->ipcObj.msgQId = NULL;
        }
    }

    int i;
    for (i = 0; i < g_numCmdFuncAdded; i++) {
        if (symRemove(this->cmdTblId, g_cmdTblItems[i].name, SYM_GLOBAL | SYM_TEXT) == ERROR) {
            LOGMSG("symRemove() error! (errNo: 0x%08X)\n", errnoGet());
            printErrno(errnoGet());

            return ERROR;
        }
    }

    if (this->cmdTblId != NULL){
        if (symTblDelete(this->cmdTblId) == ERROR){
            LOGMSG("symTblDelete() error! (errNo: 0x%08X)\n", errnoGet());
            printErrno(errnoGet());
            nRet = ERROR;
        }
        else {
            this->cmdTblId = NULL;
        }
    }

    if (this->cmdPoolId != NULL) {
        if (memPartDelete(this->cmdPoolId) == ERROR) {
            LOGMSG("memPartDelete() error! (errNo: 0x%08X)\n", errnoGet());
            printErrno(errnoGet());
            nRet = ERROR;
        } else {
            this->cmdPoolId = NULL;
        }
    }

    return nRet;
}
```

*   This function is the counterpart to `InitCmdExec`. It cleans up all allocated resources in the reverse order of creation to prevent resource leaks.
    1.  Deletes the message queue.
    2.  Removes every symbol from the symbol table.
    3.  Deletes the symbol table itself.
    4.  Deletes the memory partition.

**C Aspects Used**:
*   **Function definition**: Defining the `FinalizeCmdExec` function.
*   **Local variables**: `STATUS nRet` for tracking the return status.
*   **Conditional statements**: `if-else` constructs for checking resource validity and handling errors during deletion.
*   **Function calls**: `msgQDelete()`, `symRemove()`, `symTblDelete()`, `memPartDelete()`, `LOGMSG()`, `errnoGet()`, `printErrno()`.
*   **Pointers and structure member access**: `this->ipcObj.msgQId`, `this->cmdTblId`, `this->cmdPoolId` for accessing and modifying resource IDs.
*   **Loops**: `for` loop to iterate and remove symbols from the table.
*   **Assignment operators**: `=` for setting resource IDs to `NULL` after successful deletion.
*   **Return statements**: `return nRet` to convey the overall status of the finalization.

### Block 8: `ExecuteCmdExec` Function

```c
LOCAL STATUS ExecuteCmdExec(CmdExecInst *this) {
    STATUS nRet = OK;
    CmdExecMsg stMsg;

    FOREVER {
        if (msgQReceive(this->ipcObj.msgQId, (char *)&stMsg, sizeof(stMsg),
                        WAIT_FOREVER) == ERROR) {
            LOGMSG("msgQReceive() Error!\n");
            nRet = ERROR;
            break;
        }

#ifdef USE_CHK_TASK_STATUS
        updateTaskStatus(this->taskStatus);
#endif
        if (stMsg.cmd == CMD_EXEC_QUIT)
            break;

        switch (stMsg.cmd) {
        case CMD_EXEC_START:
            OnStart(this);
            break;
        case CMD_EXEC_STOP:
            OnStop(this);
            break;
        case CMD_EXEC_EXECUTE:
            OnExecute(this, &(stMsg.body.testControl));
            break;
        }
    }
    return nRet;
}
```

*   This function contains the main loop of the command execution task.
*   **`FOREVER`**: This is an infinite loop (e.g., `while(1)`) for continuous task execution.
*   **`msgQReceive`**: The task blocks here, waiting for a message to arrive. This is very power-efficient as the task consumes no CPU while waiting.
*   **Quit Condition**: If a `CMD_EXEC_QUIT` message is received, the loop breaks, allowing the task to proceed to `FinalizeCmdExec` and terminate cleanly.
*   **`switch` statement**: It dispatches incoming messages to the appropriate handler based on the `stMsg.cmd` field.

**C Aspects Used**:
*   **Function definition**: Defining the `ExecuteCmdExec` function.
*   **Infinite loop**: `FOREVER` macro (likely `while(1)`) for continuous task execution.
*   **Local variables**: `CmdExecMsg stMsg` for storing received messages.
*   **Function calls**: `msgQReceive()`, `LOGMSG()`, `updateTaskStatus()`, `OnStart()`, `OnStop()`, `OnExecute()`.
*   **Pointers and type casting**: `(char *)&stMsg` to cast the address of `stMsg` for `msgQReceive`.
*   **Conditional statements**: `if` statements for error checking and the quit condition.
*   **`switch` statement**: For multi-way branching based on the `stMsg.cmd` value.
*   **`break` statement**: To exit the `switch` statement and the `FOREVER` loop.
*   **Conditional compilation**: `#ifdef USE_CHK_TASK_STATUS` to include task status update logic.
*   **Structure member access**: `this->ipcObj.msgQId`, `stMsg.cmd`, `stMsg.body.testControl`.
*   **Address-of operator**: `&(stMsg.body.testControl)` to pass the address of a structure member.

### Block 9: `OnStart`, `OnStop`, and `OnExecute` Functions

```c
LOCAL void OnStart(CmdExecInst *this) {
    this->state = RUNNING;
}

LOCAL void OnStop(CmdExecInst *this) {
    this->state = STOP;
}

LOCAL STATUS OnExecute(CmdExecInst *this, OPS_TYPE_TEST_CONTROL *pTestControl) {
    if (this->state == STOP)
        return ERROR;
    if (pTestControl->cmdType == CMD_TYPE_START) {
        return startCmd(this, pTestControl->cmd, pTestControl->args);
    }
    else if (pTestControl->cmdType == CMD_TYPE_STOP) {
        return stopCmd(this);
    }
    else {
        return ERROR;
    }
}
```

*   **`OnStart`/`OnStop`**: These are simple functions that change the module's state to `RUNNING` or `STOP`, respectively.
*   **`OnExecute`**: This function handles the `CMD_EXEC_EXECUTE` message.
    1.  It first checks if the state is `STOP`; if so, it rejects the command.
    2.  It then checks the `cmdType` within the message. If it's a `CMD_TYPE_START`, it calls `startCmd` to begin a new command. If it's `CMD_TYPE_STOP`, it calls `stopCmd` to terminate the currently running command.

**C Aspects Used**:
*   **Function definitions**: Defining `OnStart`, `OnStop`, and `OnExecute` functions.
*   **Pointers and structure member access**: `this->state`, `pTestControl->cmdType`, `pTestControl->cmd`, `pTestControl->args` for accessing and modifying structure members.
*   **Assignment operator**: `=` for changing the `state` of the `CmdExecInst`.
*   **Conditional statements**: `if-else if-else` ladder for branching logic based on the module's state and command type.
*   **Return statements**: `return ERROR` or `return startCmd(...)` / `return stopCmd(...)` to control function execution flow and return status.
*   **Function calls**: `startCmd()`, `stopCmd()`.

### Block 10: Argument Parsing Utilities

```c
LOCAL void removeBlank(char *szArg) {
    char *d = szArg;

    do {
        while (isspace(*d)) {
            d++;
        }
        *szArg++ = *d++;
    } while (*szArg != NULL);
}

LOCAL STATUS setArgMask(char *szArg) {
    char ch = 0;

    if (szArg == NULL)
        return ERROR;

    if (strlen(szArg) <=2)
        return ERROR;

    if (szArg[0] != '0' || szArg[1] != 'x')
        return ERROR;

    szArg += 2;

    g_dwArgMask = 0;

    while ((ch = *szArg) != 0) {
        g_dwArgMask <<= 4;

        if (ch == '*') {
            *szArg = '0';
        } else {
            g_dwArgMask |= 0xF;
        }

        szArg++;
    }

    return OK;
}

LOCAL STATUS parseArgs(char *szArg) {
    char *pToken;
    int i = 0;

    removeBlank(szArg);

    memset(g_szArgs, 0, sizeof(g_szArgs));
    g_dwArgMask = UINT32_MAX;

    pToken = strtok(szArg, ",");
    if (pToken == NULL) {
        strcpy(g_szArgs[0], szArg);
        setArgMask(g_szArgs[0]);
    } else {
        for (i = 0; i < GUI_CMD_ARG_MAX_NUM && pToken != NULL; i++) {
            if (pToken) {
                strcpy(g_szArgs[i], pToken);
                setArgMask(g_szArgs[i]);
            }

            pToken = strtok(NULL, ",");
        }
    }

    return OK;
}
```

*   This group of functions is responsible for processing the argument string that accompanies a command.
*   **`removeBlank`**: Removes all whitespace from the argument string.
*   **`parseArgs`**: The main parser. It uses `strtok` to split the comma-separated argument string into individual arguments, which are stored in the global `g_szArgs` array.
*   **`setArgMask`**: A specialized parser that interprets each argument as a hex value, where `*` acts as a wildcard. It generates a bitmask based on this interpretation.

**C Aspects Used**:
*   **Function definitions**: Defining `removeBlank`, `setArgMask`, and `parseArgs`.
*   **Pointers and pointer arithmetic**: `char *szArg`, `char *d`, `char *pToken` for manipulating strings and iterating through characters. `szArg++`, `d++`, `szArg += 2`.
*   **Dereferencing operator**: `*d`, `*szArg` to access the character at a pointer's location.
*   **Loops**: `do-while` loop in `removeBlank`, `while` loop in `setArgMask`, `for` loop in `parseArgs` for iterating and processing strings.
*   **Conditional statements**: `if-else` constructs for error checking, character comparison, and branching logic.
*   **Standard library string functions**: `strlen()`, `memset()`, `strtok()`, `strcpy()`.
*   **Character classification functions**: `isspace()` from `ctype.h`.
*   **Bitwise operators**: `<<=` (left shift assignment), `|=` (bitwise OR assignment) in `setArgMask` for manipulating bitmasks.
*   **Global variables**: `g_szArgs`, `g_dwArgMask` are accessed and modified.
*   **Return statements**: `return OK` or `return ERROR` to indicate success or failure.

### Block 11: `startCmd` and `stopCmd` Functions

```c
LOCAL STATUS startCmd(CmdExecInst *this, char *szCmd, char *szArg) {
    SYMBOL_DESC symbolDesc;
    FUNCPTR pfnCmdFunc;

    memset(&symbolDesc, 0, sizeof(SYMBOL_DESC));
    symbolDesc.mask = SYM_FIND_BY_NAME;
    symbolDesc.name = szCmd;

    if (symFind(this->cmdTblId, &symbolDesc) == OK) {
        // printf ("Symbol name : %s\n", symbolDesc.name);
    } else {
        LOGMSG("Cannot fine \"%s\"...\n", szCmd);
        printErrno(errnoGet());
        UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");

        return ERROR;
    }

    if (SYM_IS_TEXT(symbolDesc.type) == 0) {
        LOGMSG("\"%s\" is not .text...!\n", szCmd);
        UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");

        return ERROR;
    }

    if ((strcmp(szCmd, "mtsNavDataInput") == 0) ||
        (strcmp(szCmd, "mtsLnsALignStart") == 0)) {
        memcpy(g_szArgs[0], szArg, GUI_CMD_ARG_MAX_SIZE);
    } else if (parseArgs(szArg) == ERROR) {
        LOGMSG("parseArgs: Invalid Arguments.\n");
        UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
        return ERROR;
    }

    pfnCmdFunc = (FUNCPTR)symbolDesc.value;
    this->tidCmdExec = taskSpawn(szCmd, 100, 8, 100000, (FUNCPTR)pfnCmdFunc, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    return OK;
}

LOCAL STATUS stopCmd(CmdExecInst *this) {
    if (taskIdVerify(this->tidCmdExec) == OK) {
        // if (taskSuspend(this->tidCmdExec) == ERROR) {
        //      DEBUG("taskSuspend(tidCmdExec) error!\n");
        //      UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
        //      return ERROR;
        // }
        // taskDelay(10);
        if (taskDelete(this->tidCmdExec) == ERROR) {
            DEBUG("taskDelete(tidCmdExec) error!\n");
            UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
            return ERROR;
        }

        UdpSendOpsTxResult(RESULT_TYPE_STOPPED, "STOP");
        this->tidCmdExec = TASK_ID_NULL;
    } else {
        // LOGMSG("CMD Task was Stopped.\n");
        UdpSendOpsTxResult(RESULT_TYPE_STOPPED, "STOP");
    }

    return OK;
}
```

*   **`startCmd`**: This is the core of the command execution logic.
    1.  It uses `symFind` to look up the command name (`szCmd`) in the symbol table.
    2.  If found, it parses the associated arguments (`szArg`).
    3.  It retrieves the function pointer from the symbol table result.
    4.  Crucially, it calls `taskSpawn` to create a new, separate task that will run the command function. This prevents a long-running command from blocking the main `CmdExec` task. The new task's ID is saved in `this->tidCmdExec`.
*   **`stopCmd`**: This function terminates a running command.
    1.  It uses `taskIdVerify` to check if the saved task ID is valid.
    2.  If it is, it calls `taskDelete` to forcibly terminate that task.
    3.  It then sends a UDP confirmation that the command was stopped.

**C Aspects Used**:
*   **Function definitions**: Defining `startCmd` and `stopCmd`.
*   **Local variables**: `SYMBOL_DESC symbolDesc`, `FUNCPTR pfnCmdFunc` for temporary storage.
*   **Pointers and structure member access**: `this->cmdTblId`, `symbolDesc.name`, `symbolDesc.value`, `this->tidCmdExec` for accessing and manipulating data.
*   **Function calls**: `memset()`, `symFind()`, `LOGMSG()`, `errnoGet()`, `UdpSendOpsTxResult()`, `SYM_IS_TEXT()`, `strcmp()`, `memcpy()`, `parseArgs()`, `taskSpawn()`, `taskIdVerify()`, `taskDelete()`, `DEBUG()`.
*   **Conditional statements**: `if-else if-else` constructs for error handling, symbol lookup, type checking, and argument parsing.
*   **Logical operators**: `||` (logical OR) for combining conditions.
*   **Type casting**: `(FUNCPTR)symbolDesc.value` for converting a symbol value to a function pointer.
*   **Assignment operators**: `=` for assigning task IDs and function pointers.
*   **Return statements**: `return ERROR` or `return OK` to indicate function outcome.
*   **String literals**: `"mtsNavDataInput"`, `"mtsLnsALignStart"`, `"ERROR"`, `"STOP"` for command names and messages.

### Block 12: `CmdExecMain` Function

```c
void CmdExecMain(ModuleInst *pModuleInst) {
    CmdExecInst *this = (CmdExecInst *)pModuleInst;

    if (InitCmdExec(this) == ERROR) {
        LOGMSG("InitCmdExec() error!!\n");
    } else if (ExecuteCmdExec(this) == ERROR) {
        LOGMSG("ExecuteCmdExec() error!!\n");
    }
    if (FinalizeCmdExec(this) == ERROR) {
        LOGMSG("FinalizeCmdExec() error!\n");
    }
}
```

*   This is the main entry point for the entire module's task. It orchestrates the module's lifecycle.
    1.  It casts the generic `ModuleInst` pointer to the specific `CmdExecInst` pointer.
    2.  It calls `InitCmdExec` to set everything up.
    3.  If initialization succeeds, it calls `ExecuteCmdExec` to start the main message loop.
    4.  When `ExecuteCmdExec` eventually returns (on a `CMD_EXEC_QUIT` command), `FinalizeCmdExec` is called to clean up all resources before the task terminates.

**C Aspects Used**:
*   **Function definition**: Defining the `CmdExecMain` function, which serves as the entry point for the task.
*   **Pointers and type casting**: `ModuleInst *pModuleInst` as a generic input, cast to `CmdExecInst *this` to access module-specific data.
*   **Conditional statements**: `if-else if` ladder for sequential execution of initialization, execution, and finalization, with error handling at each stage.
*   **Function calls**: `InitCmdExec()`, `ExecuteCmdExec()`, `FinalizeCmdExec()`, `LOGMSG()`.
*   **Return values**: The return values of `InitCmdExec`, `ExecuteCmdExec`, and `FinalizeCmdExec` are checked against `ERROR` to determine success or failure.
*   **Structure member access**: `this->` to access members of the `CmdExecInst` structure.re.CmdExec` are checked against `ERROR` to determine success or failure.
*   **Structure member access**: `this->` to access members of the `CmdExecInst` structure.