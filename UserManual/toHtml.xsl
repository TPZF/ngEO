<?xml version='1.0'?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:import href="docbook-xsl/html/chunk.xsl"/>
<xsl:param name="html.stylesheet" select="'../../css/userManual.css'"/>
<xsl:param name="section.autolabel" select="1"/>
<xsl:param name="section.label.includes.component.label" select="1"/>
<xsl:param name="section.autolabel.max.depth" select="3"/>
<xsl:param name="generate.toc">
book toc
chapter toc
</xsl:param>
<xsl:param name="chunker.output.encoding">UTF-8</xsl:param>
<xsl:param name="chunker.output.indent">yes</xsl:param>
<xsl:param name="suppress.navigation">1</xsl:param>
<xsl:template name="user.head.content">
<base target="content" />
</xsl:template>
</xsl:stylesheet>

