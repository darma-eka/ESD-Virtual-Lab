$xmlPath = "$env:TEMP\doc_extracted\word\document.xml"
[xml]$xml = Get-Content $xmlPath -Raw
$ns = @{w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
$paragraphs = Select-Xml -Xml $xml -XPath "//w:p" -Namespace $ns
$output = foreach ($p in $paragraphs) {
    $texts = Select-Xml -Xml $p.Node -XPath ".//w:t" -Namespace $ns | ForEach-Object { $_.Node.InnerText }
    $texts -join ""
}
$output | Where-Object { $_.Trim() -ne "" } | Set-Content "extracted_document.txt" -Encoding utf8
Write-Host "Done, lines: $($output.Count)"
