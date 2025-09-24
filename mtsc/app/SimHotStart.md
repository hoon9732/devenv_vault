void SimHotStartMain(ModuleInst *pModuleInst) {
	SimHotStartInst *this = (SimHotStartInst *)pModuleInst;
	
	if (InitSimHotStart(this) == ERROR) {
		LOGMSG("InitSimHotStart() error!!\n");
	} else if (ExecuteSimHotStart(this) == ERROR) {
		LOGMSG("ExecuteSimHotStart() error!!\n");
	}
	if (FinalizeSimHotStart(this) == ERROR) {
		LOGMSG("FinalizeSimHotStart() error!!\n");
	}
}

*   This is the main entry point for the module's task. It orchestrates the module's lifecycle.
    1.  It calls `InitSimHotStart` to set everything up.
    2.  If initialization succeeds, it calls `ExecuteSimHotStart` to start the main message loop.
    3.  When `ExecuteSimHotStart` returns (after a `QUIT` command), `FinalizeSimHotStart` is called to clean up all resources before the task terminates.

**C Aspects Used**:
*   **Function definition**: The main entry point for the task.
*   **Pointers and type casting**: Casting the generic `ModuleInst` pointer to the specific `SimHotStartInst` pointer.
*   **Conditional statements**: `if-else if` to manage the module's lifecycle (Init -> Execute -> Finalize).
*   **Function calls**: `InitSimHotStart()`, `ExecuteSimHotStart()`, `FinalizeSimHotStart()`.