@echo off
setlocal enabledelayedexpansion

REM --- Configuration ---
set "MTCS_DIR=C:\Users\USER\Documents\code\mtsc"
set "TARGET_SIZE_KB=961"
set "COEFFICIENT=1.1"

REM --- Calculate total size of .c and .h files using PowerShell ---
REM PowerShell can handle file size summation and floating-point arithmetic more easily.
REM The command below finds all .c and .h files in the MTCS_DIR, sums their sizes in bytes,
REM converts to KB, applies the coefficient, and calculates the percentage.

set "PS_COMMAND=Get-ChildItem -Path '%MTCS_DIR%' -Include *.c,*.h -Recurse -File | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum"
for /f "usebackq delims=" %%S in (`powershell -Command "%PS_COMMAND%"`) do (
    set "TOTAL_SIZE_BYTES=%%S"
)

REM Handle case where no .c or .h files are found
if "%TOTAL_SIZE_BYTES%"=="" set "TOTAL_SIZE_BYTES=0"

REM --- Convert bytes to KB ---
REM Use PowerShell for floating-point division and multiplication
set "PS_CONVERT_KB=powershell -Command "$bytes = %TOTAL_SIZE_BYTES%; $kb = $bytes / 1024; Write-Host $kb""
for /f "usebackq delims=" %%K in (`%PS_CONVERT_KB%`) do (
    set "CURRENT_SIZE_KB=%%K"
)

REM --- Calculate Percentage using PowerShell for floating-point math ---
REM (current_size_kb / TARGET_SIZE_KB) * 100.0 * COEFFICIENT
REM Formatted to two decimal places using .ToString('F2')
set "PS_CALC_PERCENTAGE=powershell -Command "$currentKB = '%CURRENT_SIZE_KB%'; $targetKB = '%TARGET_SIZE_KB%'; $coeff = '%COEFFICIENT%'; $percentage = ($currentKB / $targetKB) * 100.0 * $coeff; Write-Host ($percentage.ToString('F2'))""
for /f "usebackq delims=" %%P in (`%PS_CALC_PERCENTAGE%`) do (
    set "PROGRESS_PERCENTAGE=%%P"
)

REM --- Display Results ---
echo Calculating code progress in %MTCS_DIR%...
echo.
echo Total size of .c and .h files: %TOTAL_SIZE_BYTES% bytes
echo Current size: !CURRENT_SIZE_KB! KB (approx.)
echo Target size: %TARGET_SIZE_KB% KB
echo Coefficient: %COEFFICIENT%
echo.
echo Progress Percentage: !PROGRESS_PERCENTAGE!%%
echo.
echo Press any key to continue...
pause > nul

endlocal
