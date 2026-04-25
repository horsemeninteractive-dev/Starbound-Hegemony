# deploy.ps1
# -------------------------------------------------------------------------
#   ____  ____   ___  _  _______   ____   ___ ___ 
#  | __ )|  _ \ / _ \| |/ / ____| | __ ) / _ \_ _|
#  |  _ \| |_) | | | | ' /|  _|   |  _ \| | | | | 
#  | |_) |  _ <| |_| | . \| |___  | |_) | |_| | | 
#  |____/|_| \_\\___/|_|\_\_____| |____/ \___/___|
#               D  E  P  L  O  Y  M  E  N  T
# -------------------------------------------------------------------------

$prj = "starbound-hegemony"
$svc = "starbound-hegemony"
$region = "europe-west1"
$RepoPath = "$region-docker.pkg.dev/$prj/cloud-run-source-deploy/$svc"

Clear-Host
Write-Host @"
  ____  ____   ___  _  _______   ____   ___ ___ 
 | __ )|  _ \ / _ \| |/ / ____| | __ ) / _ \_ _|
 |  _ \| |_) | | | | ' /|  _|   |  _ \| | | | | 
 | |_) |  _ <| |_| | . \| |___  | |_) | |_| | | 
 |____/|_| \_\\___/|_|\_\_____| |____/ \___/___|
              D  E  P  L  O  Y  M  E  N  T
"@ -ForegroundColor Green

# 1. Load Env Vars
Write-Host "`n[1/2] Deploying code..." -ForegroundColor Cyan
$envVars = @()
if (Test-Path .env) {
    $envContent = Get-Content .env
    foreach ($line in $envContent) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#") -and $trimmed.Contains("=")) {
            $envVars += $trimmed
        }
    }
}
$envString = ($envVars + "NODE_ENV=production") -join ","

# 2. Deploy
Write-Host "Verifying Artifact Registry..." -ForegroundColor Gray
gcloud artifacts repositories create "cloud-run-source-deploy" --repository-format=docker --location=$region --project=$prj --quiet 2>$null

# We force the 'latest' tag so the cleanup logic knows what to spare
$imageTag = "$RepoPath" + ":latest"
gcloud run deploy $svc --source . --project $prj --region $region --set-env-vars=$envString --allow-unauthenticated --min-instances 0 --image="$imageTag"

# 3. Clean (The Surgical Strike)
Write-Host "`n[2/2] Hunting untagged ghosts..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Only list images that have NO tags (these are the intermediate build layers)
$ghosts = gcloud artifacts docker images list $RepoPath --filter="-tags:*" --format="value(DIGEST)"

if ($null -ne $ghosts -and $ghosts.Count -gt 0) {
    Write-Host "Found $($ghosts.Count) untagged ghosts. Nuking them to save storage..." -ForegroundColor Gray
    foreach ($digest in $ghosts) {
        $target = $RepoPath + "@" + $digest
        gcloud artifacts docker images delete $target --quiet
    }
    Write-Host "Cleanup complete! Storage optimized." -ForegroundColor Green
} else {
    Write-Host "No ghosts found. Your storage is already lean." -ForegroundColor Green
}

Write-Host "`nDone! Site is live at: https://starbound-hegemony-941134435684.europe-west1.run.app" -ForegroundColor Green