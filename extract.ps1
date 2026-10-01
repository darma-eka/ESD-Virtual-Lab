Add-Type -AssemblyName System.IO.Compression.FileSystem
$docxPath = "D:\PPG\Courses\Semester 2\Seminar\RPP\ARTEFAK\Pertemuan 1\4_Instrumen_Asesmen_Pertemuan_1_Diagnostik_Formatif_Sumatif.docx"

$fileStream = [System.IO.File]::Open($docxPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
$zip = New-Object System.IO.Compression.ZipArchive($fileStream, [System.IO.Compression.ZipArchiveMode]::Read)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
$fileStream.Close()

[xml]$xml = $xmlContent
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $xml.SelectNodes('//w:p', $ns)
$lines = @()
foreach ($p in $paragraphs) {
    $text = $p.InnerText
    if ($text) {
        $lines += $text
    }
}
$lines | Out-File -FilePath "extracted_docx.txt" -Encoding utf8
Write-Host "Done, total lines: $($lines.Count)"
