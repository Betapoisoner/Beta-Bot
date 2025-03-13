# Reorganize-Project.ps1
# Full reorganization script for TypeScript project structure

# Enable error handling
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = $PSScriptRoot
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupPath = "$ProjectRoot\backup-$Timestamp.zip"

function Main {
    try {
        Write-Host "Starting project reorganization..." -ForegroundColor Cyan
        
        CreateBackup
        CreateDirectoryStructure
        MoveFiles
        CleanupOldStructure
        
        Write-Host "`nReorganization complete!" -ForegroundColor Green
        ShowPostInstallInstructions
    }
    catch {
        Write-Host "`nError occurred: $_" -ForegroundColor Red
        Exit 1
    }
}

function CreateBackup {
    Write-Host "`nCreating backup..." -ForegroundColor Yellow
    Compress-Archive -Path "$ProjectRoot\*" -DestinationPath $BackupPath
    Write-Host "Backup created at: $BackupPath" -ForegroundColor Green
}

function CreateDirectoryStructure {
    Write-Host "`nCreating directory structure..." -ForegroundColor Yellow
    
    $dirs = @(
        # Core structure
        'src\config',
        'src\core\discord\commands',
        'src\core\discord\events',
        'src\core\discord\utils',
        
        # Database layer
        'src\database\models',
        'src\database\services',
        
        # Type definitions
        'src\interfaces\discord',
        'src\types',
        'src\utils',
        
        # Config files
        'config',
        
        # Test structure
        'test\unit',
        'test\integration'
    )
    
    $dirs | ForEach-Object {
        New-Item -Path $_ -ItemType Directory -Force | Out-Null
    }
}

function MoveFiles {
    Write-Host "`nMoving files..." -ForegroundColor Yellow
    
    # Config files
    SafeMove 'src\env_validation.ts' 'src\config\env.ts'
    SafeMove '.eslintrc.json' 'src\config\'
    SafeMove 'tsconfig.json' 'src\config\'
    
    # Core functionality
    SafeMove 'src\index.ts' 'src\core\'
    SafeMove 'src\commands\routes.ts' 'src\core\discord\commands\'
    SafeMove 'src\interactions\replies.ts' 'src\core\discord\utils\'
    SafeMove 'src\unregisterCommands.ts' 'src\core\discord\commands\'
    
    # Database layer
    SafeMove 'src\db.ts' 'src\database\services\PuppetService.ts'
    SafeMove 'src\interfaces\db.ts' 'src\database\models\Puppet.ts'
    
    # Environment and config
    SafeMove '.env.example' 'config\'
    SafeMove 'src\nodemon.json' 'config\'
    
    # Types
    SafeMove 'src\types\winston.d.ts' 'src\types\'
}

function SafeMove($source, $destination) {
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $destination -Force
        Write-Host "Moved: $source -> $destination" -ForegroundColor DarkGray
    }
    else {
        Write-Host "Warning: Source not found - $source" -ForegroundColor Yellow
    }
}

function CleanupOldStructure {
    Write-Host "`nCleaning up old structure..." -ForegroundColor Yellow
    
    $pathsToRemove = @(
        'src\commands',
        'src\interactions',
        'src\interfaces\db.ts',
        'src\db.ts'
    )
    
    $pathsToRemove | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item $_ -Recurse -Force
            Write-Host "Removed: $_" -ForegroundColor DarkGray
        }
    }
}

function ShowPostInstallInstructions {
    Write-Host @"


    NEXT STEPS REQUIRED:
    1. Update imports in all files using these replacements:
       [Ctrl+Shift+H in VSCode]
       
       FROM                         TO
       --------------------------------------------------
       '../env_validation'      ->  '@config/env'
       '../commands'            ->  '@commands'
       '../db'                  ->  '@database/services/PuppetService'
       '../interfaces/db'       ->  '@database/models/Puppet'
       '../interactions/replies' -> '@core/discord/utils/replies'

    2. Update tsconfig.json with path aliases:
       {
         "compilerOptions": {
           "baseUrl": ".",
           "paths": {
             "@config/*": ["src/config/*"],
             "@core/*": ["src/core/*"],
             "@database/*": ["src/database/*"],
             "@utils/*": ["src/utils/*"],
             "@types/*": ["src/types/*"]
           }
         }
       }

    3. Verify file structure and test the application!

    Backup available at: $BackupPath
"@ -ForegroundColor Cyan
}

# Execute main function
Main