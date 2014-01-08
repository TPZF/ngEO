PATH C:\Tools\xsltproc;%PATH%
xsltproc --stringparam base.dir html --stringparam chunk.section.depth 0 --timing --novalid toHtml.xsl userManual.xml 
pause

	