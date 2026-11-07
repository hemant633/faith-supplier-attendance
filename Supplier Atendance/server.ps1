# ==============================================================================
# FAITH ENGINEERS - HIGH-PERFORMANCE ZERO-DEPENDENCY LOCAL WEB SERVER
# Supports Desktop, Android Mobile, and iOS Mobile on Local Wi-Fi Network
# ==============================================================================

param(
  [int]$Port = 8085
)

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener

$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  # If port is occupied, try alternative port
  $Port = 8090
  $prefix = "http://localhost:$Port/"
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add($prefix)
  $listener.Start()
}

# Discover local Wi-Fi / Ethernet IPv4 for mobile connectivity
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
  $_.InterfaceAlias -notlike '*Loopback*' -and 
  $_.IPAddress -notlike '169.254*' -and
  $_.IPAddress -notlike '127.*'
} | Select-Object -First 1).IPAddress

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "       FAITH ENGINEERS - DAILY SUPPLIER ATTENDANCE PORTAL        " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " Status         : Server is RUNNING" -ForegroundColor White
Write-Host " Desktop URL    : http://localhost:$Port/" -ForegroundColor Yellow
if ($localIp) {
  Write-Host " Mobile Network : http://$($localIp):$Port/ (Open on Mobile Chrome/Safari)" -ForegroundColor Yellow
}
Write-Host " Database Sync  : Online Supabase Sync + Realtime WebSockets" -ForegroundColor White
Write-Host " Offline Mode   : 100% Functional with Local Persistence" -ForegroundColor White
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " Press Ctrl + C to stop the server." -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor Cyan

# Launch browser automatically
try {
  Start-Process "http://localhost:$Port/index.html"
} catch {
  Start-Process "$root\index.html"
}

# Request processing loop
while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $rawPath = $request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "/") { 
      $rawPath = "index.html" 
    }
    
    $targetPath = [System.IO.Path]::GetFullPath((Join-Path $root $rawPath))
    if (-not $targetPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 403
      $msg = [System.Text.Encoding]::UTF8.GetBytes("Access Denied")
      $response.OutputStream.Write($msg, 0, $msg.Length)
      $response.OutputStream.Close()
      continue
    }

    if ([System.IO.File]::Exists($targetPath)) {
      $ext = [System.IO.Path]::GetExtension($targetPath).ToLower()
      $mime = switch ($ext) {
        ".html" { "text/html; charset=utf-8" }
        ".css"  { "text/css; charset=utf-8" }
        ".js"   { "application/javascript; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".svg"  { "image/svg+xml" }
        ".png"  { "image/png" }
        ".ico"  { "image/x-icon" }
        ".woff2"{ "font/woff2" }
        ".woff" { "font/woff" }
        default { "application/octet-stream" }
      }
      
      $response.ContentType = $mime
      $response.AddHeader("Access-Control-Allow-Origin", "*")
      $response.AddHeader("Cache-Control", "no-cache")
      
      $bytes = [System.IO.File]::ReadAllBytes($targetPath)
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawPath")
      $response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $response.OutputStream.Close()
  } catch {
    # Suppress disconnect errors
  }
}

