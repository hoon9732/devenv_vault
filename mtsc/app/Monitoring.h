#pragma once

#include <vwworks.h>
#include "../lib/util/MOduleCommon.h"
#include "../lib/mtsLib.h"
#include "typeDef/tmType/tmSts.h"

#define MONITORING_TASK_NAME	"tMonitoring"

typedef enum {
	MONITORING_NULL,
	MONITORING_START,
	MONITORING_STOP,
	MONITORING_QUIT,
	MONITORING_EXECUTE,
	MONITORING_MAX
} MonitoringCmd;

typedef struct {
	unsigned int	cmd;
	unsigned int	len;
	union {
		unsigned char	buf[1];
	} body;
} MonitoringMsg;

typedef struct {
	unsigned int			mteBit;
	DIO_TYPE_DI_SYS			diSys;
	DIO_TYPE_DI_BIT			diBit;
	DIO_TYPE_DO_SYS			doSys;
	DIO_TYPE_PPS_CTRL		ppsCtrl;
	DIO_TYPE_PPS_ENABLE		ppsEnable;
	DIO_TYPE_PPS_INT_STS	ppsIntSts;
	double					main28vVoltage
	double					main28vCurrent;
	double					main5vVoltage;
	double					main5vCurrent;
	double					mainExtVoltage;
	double					mainExtCurrent;
	double 					cluExtVoltage;
	double					cluExtCurrent;
	double					tlmExtVoltage;
	double					tlmExtCurrent;
	
	double					pps130VdcMon;
	double					press;
	
	unsigned int			dacChannel;
	double					dacValue;
} __attribute__((packed)) MonitoringLog;

IMPORT const ModuleInst *g_hMonitoring;
IMPORT TM_COMM_STS * g_pTmCommSts;

IMPORT void MonitoringMain(ModuleInst *pModuleInst);
