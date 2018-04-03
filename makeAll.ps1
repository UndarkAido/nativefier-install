$dir = [System.IO.Path]::GetFullPath((Join-Path $(([io.fileinfo]$MyInvocation.MyCommand.Definition).DirectoryName) ".\"))

Get-ChildItem -Path (Join-Path $dir configs\) -Filter *.json -Recurse -File | ForEach-Object {
    node $dir"nativefier-install.js" ([io.fileinfo]$_).basename
}