import * as chalk from 'chalk';
import { format } from 'date-and-time';

const colorMap = {
  success: chalk.green,
  info: chalk.blue,
  verbose: chalk.grey,
  plain: chalk.white,
  warning: chalk.yellow,
  error: chalk.red,
};

export class Logger {
  static success(module: string, message: any) {
    this._log('success', module, message);
  }

  static info(module: string, message: any) {
    this._log('info', module, message);
  }

  static hint(module: string, message: any) {
    this._log('verbose', module, message);
  }

  static log(module: string, message: any) {
    this._log('plain', module, message);
  }

  static warn(module: string, message: any, reason?: any, hint?: any) {
    this._log('warning', module, message, reason, hint);
  }

  static error(module: string, message: any, reason?: any, hint?: any) {
    this._log('error', module, message, reason, hint);
  }

  private static _log(
    type: 'success' | 'info' | 'verbose' | 'plain' | 'warning' | 'error',
    module: string,
    message: any,
    reason?: any,
    hint?: any
  ): void {
    const baseColor = colorMap[type];
    let result =
      chalk.grey(`[${format(new Date(), 'mm/dd HH:MM:ss.l')}] `) +
      baseColor(`│${module}│ `) +
      message;
    if (reason) {
      result += ` due to: \n` + ' '.repeat(22 + module.length);
      if (hint) {
        result += '├ ${reason}\n';
      } else {
        result += `└ ${reason}`;
      }
    }
    if (hint) {
      result +=
        ' '.repeat(22 + module.length) +
        `├ ${chalk.blue('You can try solutions below: \n')}` +
        ' '.repeat(22 + module.length);
      result += `└ ${hint.replaceAll(
        '\n',
        '\n' + ' '.repeat(24 + module.length)
      )}`;
    }
    console.log(result);
  }
}
