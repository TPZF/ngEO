call "C:\Program Files\nodejs\nodejsvars.bat"
node r.js -o build.js
node postProcessor.js
call lessc --yui-compress ..\client\css\main.less > output\css\main.css
call lessc --yui-compress ..\client\css\help.less > output\css\help.css
pause