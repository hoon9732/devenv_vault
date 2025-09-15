@echo off
cd "C:\Users\USER\Documents\code"
git add .
git commit -m "Automated backup %date% %time%"
git push origin main
