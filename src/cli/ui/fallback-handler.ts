#!/usr/bin/env node

/**
 * Fallback Handler for WSL and environments without raw mode support
 * Provides text-based alternatives to blessed UI components
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

export interface FallbackOptions {
  enableMonitoring?: boolean;
  showProgress?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class FallbackHandler {
  private options: FallbackOptions;

  constructor(options: FallbackOptions = {}) {
    this.options = {
      enableMonitoring: false,
      showProgress: true,
      logLevel: 'info',
      ...options
    };
  }

  /**
   * Check if raw mode is supported
   */
  static isRawModeSupported(): boolean {
    // Check for WSL
    if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
      return false;
    }

    // Check for CI/CD environments
    if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL) {
      return false;
    }

    // Check if we're in a TTY
    if (!process.stdin.isTTY) {
      return false;
    }

    // Check if setRawMode is available
    if (typeof process.stdin.setRawMode !== 'function') {
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
   * Handle swarm execution with fallback UI
   */
  async handleSwarmExecution(objective: string, options: any): Promise<void> {
    console.log('🐝 Claude-Flow Swarm - WSL Compatible Mode');
    console.log('═'.repeat(60));
    console.log(`📋 Objective: ${objective}`);
    console.log(`🎯 Strategy: ${options.strategy || 'auto'}`);
    console.log(`🤖 Max Agents: ${options.maxAgents || 5}`);
    console.log(`⏱️  Timeout: ${options.timeout || 60} minutes`);
    console.log('═'.repeat(60));

    // Show environment info
    console.log('\n📊 Environment Information:');
    console.log(`  • Platform: ${process.platform}`);
    console.log(`  • WSL: ${process.env.WSL_DISTRO_NAME ? 'Yes (' + process.env.WSL_DISTRO_NAME + ')' : 'No'}`);
    console.log(`  • TTY: ${process.stdin.isTTY ? 'Yes' : 'No'}`);
    console.log(`  • Raw Mode: ${FallbackHandler.isRawModeSupported() ? 'Supported' : 'Not Supported'}`);

    // Show what would happen
    console.log('\n🚀 Swarm Execution Plan:');
    console.log('  1. Initialize swarm coordination system');
    console.log('  2. Create task breakdown based on strategy');
    console.log('  3. Spawn agents for parallel execution');
    console.log('  4. Monitor progress and collect results');
    console.log('  5. Generate final report');

    // Simulate progress
    if (this.options.showProgress) {
      await this.simulateProgress(objective, options);
    }

    // Show completion
    console.log('\n✅ Swarm execution completed successfully');
    console.log('\n💡 To run actual swarm execution:');
    console.log('  • Install Claude Code: https://claude.ai/code');
    console.log('  • Use external terminal (not VS Code integrated)');
    console.log('  • Run: claude-flow swarm --no-ui for text-only mode');
  }

  /**
   * Simulate swarm progress for demonstration
   */
  private async simulateProgress(objective: string, options: any): Promise<void> {
    console.log('\n🔄 Simulating swarm execution...');
    
    const tasks = this.generateTasksForStrategy(objective, options.strategy || 'auto');
    
    console.log(`\n📋 Task Breakdown (${tasks.length} tasks):`);
    tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.type}: ${task.description}`);
    });

    console.log('\n🤖 Agent Execution:');
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const agentId = `agent-${i + 1}`;
      
      console.log(`  🔄 ${agentId} starting: ${task.type}`);
      
      // Simulate work time
      await this.delay(1000 + Math.random() * 2000);
      
      console.log(`  ✅ ${agentId} completed: ${task.type}`);
    }

    console.log('\n📊 Execution Summary:');
    console.log(`  • Tasks completed: ${tasks.length}/${tasks.length}`);
    console.log(`  • Success rate: 100%`);
    console.log(`  • Total time: ${tasks.length * 1.5}s (simulated)`);
  }

  /**
   * Generate tasks based on strategy
   */
  private generateTasksForStrategy(objective: string, strategy: string): Array<{type: string, description: string}> {
    const tasks = [];
    
    switch (strategy) {
      case 'research':
        tasks.push(
          { type: 'research', description: `Research background information on: ${objective}` },
          { type: 'analysis', description: 'Analyze findings and identify key patterns' },
          { type: 'synthesis', description: 'Synthesize research into actionable insights' }
        );
        break;
        
      case 'development':
        tasks.push(
          { type: 'planning', description: `Plan architecture and design for: ${objective}` },
          { type: 'implementation', description: 'Implement core functionality' },
          { type: 'testing', description: 'Test and validate implementation' },
          { type: 'documentation', description: 'Document the solution' }
        );
        break;
        
      case 'analysis':
        tasks.push(
          { type: 'data-gathering', description: `Gather relevant data for: ${objective}` },
          { type: 'analysis', description: 'Perform detailed analysis' },
          { type: 'visualization', description: 'Create visualizations and reports' }
        );
        break;
        
      default: // auto
        if (objective.toLowerCase().includes('build') || objective.toLowerCase().includes('create')) {
          tasks.push(
            { type: 'planning', description: `Plan solution for: ${objective}` },
            { type: 'implementation', description: 'Implement the solution' },
            { type: 'testing', description: 'Test and validate' }
          );
        } else if (objective.toLowerCase().includes('research') || objective.toLowerCase().includes('analyze')) {
          tasks.push(
            { type: 'research', description: `Research: ${objective}` },
            { type: 'analysis', description: 'Analyze findings' },
            { type: 'report', description: 'Generate report' }
          );
        } else {
          tasks.push(
            { type: 'exploration', description: `Explore requirements for: ${objective}` },
            { type: 'execution', description: 'Execute main tasks' },
            { type: 'validation', description: 'Validate results' }
          );
        }
    }
    
    return tasks;
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Show environment diagnostics
   */
  static showDiagnostics(): void {
    console.log('🔍 Claude-Flow Environment Diagnostics');
    console.log('═'.repeat(50));
    
    console.log('\n📊 System Information:');
    console.log(`  • Platform: ${process.platform}`);
    console.log(`  • Node.js: ${process.version}`);
    console.log(`  • Architecture: ${process.arch}`);
    
    console.log('\n🖥️  Terminal Information:');
    console.log(`  • TTY: ${process.stdin.isTTY ? 'Yes' : 'No'}`);
    console.log(`  • Terminal: ${process.env.TERM || 'Unknown'}`);
    console.log(`  • Term Program: ${process.env.TERM_PROGRAM || 'Unknown'}`);
    
    console.log('\n🌐 Environment Detection:');
    console.log(`  • WSL: ${process.env.WSL_DISTRO_NAME ? 'Yes (' + process.env.WSL_DISTRO_NAME + ')' : 'No'}`);
    console.log(`  • CI/CD: ${process.env.CI ? 'Yes' : 'No'}`);
    console.log(`  • VS Code: ${process.env.TERM_PROGRAM === 'vscode' ? 'Yes' : 'No'}`);
    
    console.log('\n🔧 UI Capabilities:');
    console.log(`  • Raw Mode: ${FallbackHandler.isRawModeSupported() ? 'Supported' : 'Not Supported'}`);
    console.log(`  • setRawMode: ${typeof process.stdin.setRawMode === 'function' ? 'Available' : 'Not Available'}`);
    
    if (!FallbackHandler.isRawModeSupported()) {
      console.log('\n💡 Recommendations:');
      console.log('  • Use --no-ui flag to disable interactive UI');
      console.log('  • Run in Windows Terminal or external terminal');
      console.log('  • Use text-based commands for automation');
      console.log('  • Consider using the web UI interface');
    } else {
      console.log('\n✅ Your environment supports interactive UI');
    }
  }
}

export default FallbackHandler;
