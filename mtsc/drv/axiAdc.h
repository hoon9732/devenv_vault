#ifndef AXIADC_H
#define AXIADC_H

#include <vxWorks.h>

#define AXI_ADC1_DAC_DATA_GAIN		(0.00015259)

IMPORT STATUS axiAdcInit(void);
IMPORT STATUS axiAdcShowRegs(UINT32 dwDevNo);
IMPORT STATUS axiAdcShowRegsRaw(UINT32 dwDevNo);

IMPORT double axiAdc0Data0(void);
IMPORT double axiAdc0Data1(void);
IMPORT double axiAdc0Data2(void);
IMPORT double axiAdc0Data3(void);
IMPORT double axiAdc0Data4(void);
IMPORT double axiAdc0Data5(void);
IMPORT double axiAdc0Data6(void);
IMPORT double axiAdc0Data7(void);
IMPORT double axiAdc0Data8(void);
IMPORT double axiAdc0Data9(void);
IMPORT UINT32 axiAdc1DacCtrlRead(void);
IMPORT STATUS axiAdc1DacCtrlWrite(UINT32 dwVal);
IMPORT UINT32 axiAdc1DacCh(void);
IMPORT double axiAdc1DacValue(void);
IMPORT double axiAdc1Data0(void);
IMPORT double axiAdc1Data0(void);

#endif
