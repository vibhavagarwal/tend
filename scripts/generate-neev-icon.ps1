Add-Type -AssemblyName System.Drawing

$output = Join-Path $PSScriptRoot '..\assets\neev-icon.png'
$size = 1024
$bitmap = [System.Drawing.Bitmap]::new($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(235, 239, 238))
$green = [System.Drawing.Color]::FromArgb(0, 107, 95)

function New-Pen([int] $width) {
  $pen = [System.Drawing.Pen]::new($green, $width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  return $pen
}

$n = New-Pen 96
$nPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$nPath.AddLine(290, 738, 290, 340)
$nPath.AddArc(290, 220, 240, 240, 180, 180)
$nPath.AddLine(530, 340, 530, 738)
$graphics.DrawPath($n, $nPath)

$echoNear = New-Pen 58
$graphics.DrawBezier($echoNear, 546, 550, 651, 550, 736, 635, 736, 740)
$echoFar = New-Pen 46
$graphics.DrawBezier($echoFar, 634, 360, 773, 360, 886, 473, 886, 612)

$bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
$echoFar.Dispose(); $echoNear.Dispose(); $n.Dispose(); $nPath.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
