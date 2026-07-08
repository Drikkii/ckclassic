Add-Type -AssemblyName System.Drawing

function Convert-BlackToTransparent {
  param([System.Drawing.Bitmap]$Bitmap, [int]$Threshold = 18)
  $out = New-Object System.Drawing.Bitmap $Bitmap.Width, $Bitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $c = $Bitmap.GetPixel($x, $y)
      if ($c.R -le $Threshold -and $c.G -le $Threshold -and $c.B -le $Threshold) {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      } else {
        $out.SetPixel($x, $y, $c)
      }
    }
  }
  return $out
}

function Get-GoldColor {
  param([System.Drawing.Bitmap]$Bitmap)
  $rs = New-Object System.Collections.Generic.List[int]
  $gs = New-Object System.Collections.Generic.List[int]
  $bs = New-Object System.Collections.Generic.List[int]
  for ($y = 0; $y -lt $Bitmap.Height; $y += 3) {
    for ($x = 0; $x -lt $Bitmap.Width; $x += 3) {
      $c = $Bitmap.GetPixel($x, $y)
      if ($c.A -gt 200 -and $c.R -gt 130 -and $c.G -gt 95 -and $c.B -lt 120) {
        $rs.Add($c.R) | Out-Null
        $gs.Add($c.G) | Out-Null
        $bs.Add($c.B) | Out-Null
      }
    }
  }
  if ($rs.Count -eq 0) {
    return [System.Drawing.Color]::FromArgb(205, 160, 85)
  }
  $avgR = [int]([Math]::Round(($rs | Measure-Object -Average).Average))
  $avgG = [int]([Math]::Round(($gs | Measure-Object -Average).Average))
  $avgB = [int]([Math]::Round(($bs | Measure-Object -Average).Average))
  return [System.Drawing.Color]::FromArgb($avgR, $avgG, $avgB)
}

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$origPath = Join-Path $root 'img\logo\logotip-original.png'
$outPath = Join-Path $root 'img\logo\logotip.png'

$src = [System.Drawing.Bitmap]::FromFile($origPath)
$w = $src.Width
$cropH = 752

$crop = New-Object System.Drawing.Bitmap $w, $cropH
$gc = [System.Drawing.Graphics]::FromImage($crop)
$gc.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $cropH), (New-Object System.Drawing.Rectangle 0, 0, $w, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
$gc.Dispose()
$src.Dispose()

$cropTransparent = Convert-BlackToTransparent -Bitmap $crop
$crop.Dispose()

$scale = 1.16
$sw = [int][Math]::Round($w * $scale)
$sh = [int][Math]::Round($cropH * $scale)
$scaled = New-Object System.Drawing.Bitmap $sw, $sh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gs = [System.Drawing.Graphics]::FromImage($scaled)
$gs.Clear([System.Drawing.Color]::Transparent)
$gs.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gs.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$gs.DrawImage($cropTransparent, 0, 0, $sw, $sh)
$gs.Dispose()
$cropTransparent.Dispose()

$scaledTransparent = Convert-BlackToTransparent -Bitmap $scaled
$scaled.Dispose()

$gold = Get-GoldColor -Bitmap $scaledTransparent
$textBand = 108
$padTop = 0
$logoH = [int][Math]::Round($sh * ($w / [double]$sw))
$finalH = $padTop + $logoH + $textBand
$out = New-Object System.Drawing.Bitmap $w, $finalH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$go = [System.Drawing.Graphics]::FromImage($out)
$go.Clear([System.Drawing.Color]::Transparent)
$go.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect = New-Object System.Drawing.Rectangle ([int][Math]::Max(0, ($sw - $w) / 2), 0, [Math]::Min($w, $sw), $logoH)
$go.DrawImage($scaledTransparent, (New-Object System.Drawing.Rectangle 0, $padTop, $w, $logoH), $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$scaledTransparent.Dispose()

$fontStyle = [System.Drawing.FontStyle]::Bold
$font = New-Object System.Drawing.Font ('Times New Roman', 54, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
$brush = New-Object System.Drawing.SolidBrush $gold
$go.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$text = [string]::Concat(
  [char]0x0424, [char]0x0410, [char]0x0411, [char]0x0420, [char]0x0418, [char]0x041A, [char]0x0410,
  ' ',
  [char]0x041C, [char]0x0415, [char]0x0411, [char]0x0415, [char]0x041B, [char]0x0418
)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$textRect = New-Object System.Drawing.RectangleF 0, ($padTop + $logoH), $w, $textBand
$go.DrawString($text, $font, $brush, $textRect, $format)
$brush.Dispose()
$font.Dispose()
$go.Dispose()

$out.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()

Write-Output "Saved transparent logo to $outPath ($w x $finalH), gold=$gold"
