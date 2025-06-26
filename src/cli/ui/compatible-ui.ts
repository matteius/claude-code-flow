#!/usr/bin/env node

/**
 * UI Compatibility Layer for Claude-Flow
 * Handles environments where raw mode is not supported (WSL, CI/CD, etc.)
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface UIOptions {
  fallbackToText?: boolean;
  enableMonitoring?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class CompatibleUI {
  private options: UIOptions;

  constructor(options: UIOptions = {}) {
    this.options = {
      fallbackToText: true,
      enableMonitoring: false,
      logLevel: 'info',
      ...options
    };
  }

  /**
   * Check if the current environment supports interactive UI
   */
  static isUISupported(): boolean {
    // Check if we're in a TTY
    if (!process.stdin.isTTY) {
      return false;
    }

    // Check if raw mode is available
    if (typeof process.stdin.setRawMode !== 'function') {
      return false;
    }

    // Check for known problematic environments
    const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV;
    const isCI = process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL;
    const isVSCode = process.env.TERM_PROGRAM === 'vscode';

    if (isWSL || isCI) {
      return false;
    }

    // Test raw mode capability
    try {
      const originalRawMode = process.stdin.isRaw;
      process.stdin.setRawMode(true);
      process.stdin.setRawMode(originalRawMode || false);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Launch UI with compatibility checks
   */
  async launchUI(uiType: 'swarm' | 'monitor' | 'dashboard', args: string[] = []): Promise<void> {
    const isSupported = CompatibleUI.isUISupported();

    if (!isSupported) {
      console.log('⚠️  Interactive UI not supported in this environment');
      console.log('📊 Reason: Raw mode not available (WSL, CI/CD, or limited terminal)');
      
      if (this.options.fallbackToText) {
        console.log('🔄 Falling back to text-based interface...\n');
        await this.launchTextFallback(uiType, args);
      } else {
        console.log('💡 Suggestions:');
        console.log('  • Use --no-ui flag to disable UI');
        console.log('  • Run in external terminal (not VS Code integrated)');
        console.log('  • Use text-based commands instead');
        throw new Error('UI not supported in current environment');
      }
      return;
    }

    // Try to launch the blessed UI
    try {
      await this.launchBlessedUI(uiType, args);
    } catch (error) {
      console.log(`⚠️  Failed to launch blessed UI: ${error.message}`);
      
      if (this.options.fallbackToText) {
        console.log('🔄 Falling back to text-based interface...\n');
        await this.launchTextFallback(uiType, args);
      } else {
        throw error;
      }
    }
  }

  /**
   * Launch blessed-based UI
   */
  private async launchBlessedUI(uiType: string, args: string[]): Promise<void> {
    const scriptPath = this.getUIScriptPath(uiType);
    
    if (!existsSync(scriptPath)) {
      throw new Error(`UI script not found: ${scriptPath}`);
    }

    return new Promise((resolve, reject) => {
      const process = spawn('node', [scriptPath, ...args], {
        stdio: 'inherit',
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          TERM: process.env.TERM || 'xterm-256color'
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to launch UI: ${error.message}`));
      });

      process.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`UI process exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Launch text-based fallback interface
   */
  private async launchTextFallback(uiType: string, args: string[]): Promise<void> {
    switch (uiType) {
      case 'swarm':
        await this.launchSwarmTextInterface(args);
        break;
      case 'monitor':
        await this.launchMonitorTextInterface(args);
        break;
      case 'dashboard':
        await this.launchDashboardTextInterface(args);
        break;
      default:
        console.log(`📋 Text interface for ${uiType} not implemented`);
        console.log('💡 Use standard CLI commands instead');
    }
  }

  /**
   * Text-based swarm interface
   */
  private async launchSwarmTextInterface(args: string[]): Promise<void> {
    console.log('🐝 Claude-Flow Swarm - Text Interface');
    console.log('═'.repeat(50));
    
    // Show current swarm status
    await this.showSwarmStatus();
    
    // Show available commands
    console.log('\n📋 Available Commands:');
    console.log('  • claude-flow swarm "<objective>" - Create new swarm');
    console.log('  • claude-flow swarm list - List active swarms');
    console.log('  • claude-flow swarm status <id> - Show swarm status');
    console.log('  • claude-flow status - Show system status');
    console.log('  • claude-flow monitor - Monitor system activity');
    
    console.log('\n💡 For real-time monitoring, use:');
    console.log('  watch -n 2 "claude-flow status"');
    
    // If monitoring is enabled, start a simple text monitor
    if (this.options.enableMonitoring) {
      await this.startTextMonitoring();
    }
  }

  /**
   * Text-based monitor interface
   */
  private async launchMonitorTextInterface(args: string[]): Promise<void> {
    console.log('📊 Claude-Flow Monitor - Text Interface');
    console.log('═'.repeat(50));
    
    await this.startTextMonitoring();
  }

  /**
   * Text-based dashboard interface
   */
  private async launchDashboardTextInterface(args: string[]): Promise<void> {
    console.log('📈 Claude-Flow Dashboard - Text Interface');
    console.log('═'.repeat(50));
    
    await this.showSystemDashboard();
  }

  /**
   * Show current swarm status
   */
  private async showSwarmStatus(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const swarmRunsDir = './swarm-runs';
      
      try {
        const runs = await fs.readdir(swarmRunsDir);
        
        if (runs.length === 0) {
          console.log('📋 No active swarms found');
          return;
        }

        console.log(`\n🐝 Active Swarms (${runs.length}):`);
        console.log('─'.repeat(50));
        
        for (const runDir of runs.slice(0, 5)) { // Show max 5 recent
          try {
            const configPath = join(swarmRunsDir, runDir, 'config.json');
            const configData = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configData);
            
            const startTime = new Date(config.startTime).toLocaleString();
            console.log(`  🆔 ${config.swarmId}`);
            console.log(`     📝 ${config.objective}`);
            console.log(`     ⏰ Started: ${startTime}`);
            console.log(`     🎯 Strategy: ${config.options?.strategy || 'auto'}`);
            console.log();
          } catch (e) {
            // Skip invalid configs
          }
        }
        
        if (runs.length > 5) {
          console.log(`     ... and ${runs.length - 5} more`);
        }
      } catch (e) {
        console.log('📋 No swarm runs directory found');
      }
    } catch (error) {
      console.log(`⚠️  Error reading swarm status: ${error.message}`);
    }
  }

  /**
   * Show system dashboard
   */
  private async showSystemDashboard(): Promise<void> {
    console.log('\n📊 System Status:');
    console.log('─'.repeat(30));
    
    // Show basic system info
    console.log(`  🖥️  Platform: ${process.platform}`);
    console.log(`  📦 Node.js: ${process.version}`);
    console.log(`  💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`  ⏱️  Uptime: ${Math.round(process.uptime())}s`);
    
    // Check for active processes
    console.log('\n🔄 Active Components:');
    console.log('  • CLI: ✅ Running');
    console.log('  • Orchestrator: ⚠️  Not started');
    console.log('  • MCP Server: ⚠️  Not started');
    console.log('  • Web UI: ⚠️  Not started');
    
    console.log('\n💡 To start components:');
    console.log('  claude-flow start --ui');
    console.log('  claude-flow mcp start');
  }

  /**
   * Start simple text monitoring
   */
  private async startTextMonitoring(): Promise<void> {
    console.log('\n👀 Starting text monitoring (Ctrl+C to stop)...');
    console.log('─'.repeat(50));
    
    const monitorInterval = setInterval(async () => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n[${timestamp}] System Check:`);
      
      // Check memory usage
      const memUsage = process.memoryUsage();
      console.log(`  💾 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      
      // Check for new swarm activity
      try {
        const fs = await import('fs/promises');
        const swarmRunsDir = './swarm-runs';
        const runs = await fs.readdir(swarmRunsDir);
        console.log(`  🐝 Active swarms: ${runs.length}`);
      } catch (e) {
        console.log(`  🐝 Active swarms: 0`);
      }
      
      console.log('  ⏰ Next check in 5 seconds...');
    }, 5000);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(monitorInterval);
      console.log('\n\n👋 Monitoring stopped');
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {}); // Never resolves, keeps monitoring running
  }

  /**
   * Get the path to UI script
   */
  private getUIScriptPath(uiType: string): string {
    const projectRoot = join(__dirname, '../../..');
    
    switch (uiType) {
      case 'swarm':
        return join(projectRoot, 'src/cli/simple-commands/swarm-ui.js');
      case 'monitor':
        return join(projectRoot, 'src/cli/simple-commands/monitor-ui.js');
      case 'dashboard':
        return join(projectRoot, 'src/cli/simple-commands/dashboard-ui.js');
      default:
        throw new Error(`Unknown UI type: ${uiType}`);
    }
  }
}

/**
 * Utility function to check UI support
 */
export function checkUISupport(): { supported: boolean; reason?: string; suggestions: string[] } {
  const suggestions = [
    'Use --no-ui flag to disable UI',
    'Run in external terminal (not VS Code integrated)',
    'Use text-based commands instead',
    'Try running in a different terminal application'
  ];

  if (!process.stdin.isTTY) {
    return {
      supported: false,
      reason: 'Not running in a TTY environment',
      suggestions
    };
  }

  if (typeof process.stdin.setRawMode !== 'function') {
    return {
      supported: false,
      reason: 'Raw mode not available',
      suggestions
    };
  }

  const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV;
  if (isWSL) {
    return {
      supported: false,
      reason: 'Running in WSL environment',
      suggestions: [
        'Use Windows Terminal or external terminal',
        'Use --no-ui flag to disable UI',
        'Use text-based commands instead'
      ]
    };
  }

  const isCI = process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL;
  if (isCI) {
    return {
      supported: false,
      reason: 'Running in CI/CD environment',
      suggestions: [
        'Use --no-ui flag in CI/CD scripts',
        'Use text-based commands for automation'
      ]
    };
  }

  try {
    const originalRawMode = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.setRawMode(originalRawMode || false);
    return { supported: true, suggestions: [] };
  } catch (error) {
    return {
      supported: false,
      reason: `Raw mode test failed: ${error.message}`,
      suggestions
    };
  }
}

// Export for CLI usage
export default CompatibleUI;
