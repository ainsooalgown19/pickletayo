Add-Type -AssemblyName System.Drawing

$brandDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\public\brand"))
$publicDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\public"))

function New-LogoBitmap([int] $width, [int] $height, [bool] $withBackground = $false) {
  $bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($withBackground) { $graphics.Clear([System.Drawing.Color]::White) } else { $graphics.Clear([System.Drawing.Color]::Transparent) }
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Add-Mark($graphics, [float] $x, [float] $y, [float] $width, [float] $height) {
  $state = $graphics.Save()
  $graphics.TranslateTransform($x, $y)
  $graphics.ScaleTransform($width / 512, $height / 640)
  $outer = [System.Drawing.Drawing2D.GraphicsPath]::new([System.Drawing.Drawing2D.FillMode]::Alternate)
  $outer.StartFigure(); $outer.AddBezier(256, 32, 129.5, 32, 48, 126.3, 48, 253.4); $outer.AddBezier(48, 253.4, 48, 345.1, 96.7, 411.7, 156.2, 486.6); $outer.AddLine(156.2, 486.6, 256, 616); $outer.AddLine(256, 616, 355.8, 486.6); $outer.AddBezier(355.8, 486.6, 415.3, 411.7, 464, 345.1, 464, 253.4); $outer.AddBezier(464, 253.4, 464, 126.3, 382.5, 32, 256, 32); $outer.CloseFigure()
  $outer.StartFigure(); $outer.AddLine(197.4, 137.2, 314.6, 137.2); $outer.AddBezier(314.6, 137.2, 365.6, 137.2, 400, 176.4, 400, 228.7); $outer.AddLine(400, 228.7, 400, 315.6); $outer.AddBezier(400, 315.6, 400, 362.6, 379.6, 398.3, 341.7, 427.7); $outer.AddBezier(341.7, 427.7, 306.4, 455.1, 294.1, 490.2, 286, 547); $outer.AddBezier(286, 547, 280.8, 582.4, 230.8, 582.4, 226, 547); $outer.AddBezier(226, 547, 218.5, 491.8, 205.5, 455.4, 170.3, 427.7); $outer.AddBezier(170.3, 427.7, 132.6, 398.1, 112, 364.2, 112, 315.6); $outer.AddLine(112, 315.6, 112, 228.7); $outer.AddBezier(112, 228.7, 112, 176.4, 146.4, 137.2, 197.4, 137.2); $outer.CloseFigure()
  $green = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#0A7E45")); $graphics.FillPath($green, $outer)
  $ball = [System.Drawing.Drawing2D.GraphicsPath]::new([System.Drawing.Drawing2D.FillMode]::Alternate)
  $ball.AddEllipse(178, 207, 156, 156)
  @(@(256,237),@(208,270),@(304,270),@(256,289),@(216,321),@(296,321),@(256,340)) | ForEach-Object { $ball.AddEllipse($_[0] - 11, $_[1] - 11, 22, 22) }
  $blue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#009FE3")); $graphics.FillPath($blue, $ball)
  $ball.Dispose(); $blue.Dispose(); $green.Dispose(); $outer.Dispose(); $graphics.Restore($state)
}

function Save-Mark([int] $size, [string] $path) {
  $canvas = New-LogoBitmap $size $size
  $markHeight = $size * 0.88; $markWidth = $markHeight * 0.8
  Add-Mark $canvas.Graphics (($size - $markWidth) / 2) (($size - $markHeight) / 2) $markWidth $markHeight
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose(); $canvas.Bitmap.Dispose()
}

New-Item -ItemType Directory -Force -Path $brandDirectory | Out-Null
Save-Mark 32 (Join-Path $publicDirectory "favicon-32x32.png")
Save-Mark 180 (Join-Path $publicDirectory "apple-touch-icon.png")
Save-Mark 192 (Join-Path $brandDirectory "pickletayo-icon-192.png")
Save-Mark 512 (Join-Path $brandDirectory "pickletayo-icon-512.png")

$social = New-LogoBitmap 1200 630 $true
$background = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#F7F9FC")); $social.Graphics.FillRectangle($background, 0, 0, 1200, 630)
Add-Mark $social.Graphics 126 83 360 450
$font = [System.Drawing.Font]::new("Segoe UI", 88, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$green = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#0A7E45")); $blue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#0073A2"))
$social.Graphics.DrawString("Pickle", $font, $green, 512, 213); $pickleWidth = $social.Graphics.MeasureString("Pickle", $font).Width; $social.Graphics.DrawString("Tayo", $font, $blue, 512 + $pickleWidth - 10, 213)
$taglineFont = [System.Drawing.Font]::new("Segoe UI", 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel); $muted = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#475467")); $social.Graphics.DrawString("Find courts. Meet players. Play more.", $taglineFont, $muted, 518, 330)
$social.Bitmap.Save((Join-Path $brandDirectory "pickletayo-social-1200x630.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$muted.Dispose(); $taglineFont.Dispose(); $blue.Dispose(); $green.Dispose(); $font.Dispose(); $background.Dispose(); $social.Graphics.Dispose(); $social.Bitmap.Dispose()
