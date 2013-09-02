call "C:\Program Files\nodejs\nodejsvars.bat"
node r.js -o build.js
node postProcessor.js
@echo Compress main.css
call lessc --yui-compress ..\client\css\main.less > output\css\main.css
@echo Compress home.css
call lessc --yui-compress ..\client\css\home.less > output\css\home.css
@echo Compress help.css
call lessc --yui-compress ..\client\css\help.less > output\css\help.css
pause