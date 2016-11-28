REM install from https://www.zlatkovic.com/libxml.en.html the libxslt and put the xsltproc command in your environment home so the command xsltproc is recognized
xsltproc --stringparam base.dir html --stringparam chunk.section.depth 0 --timing --novalid toHtml.xsl userManual.xml 
pause

	