import inquirer from 'inquirer';

export class Logger {
  static ui?: any;

  static log(message: string) {
    if (!this.ui) {
      this.ui = new inquirer.ui.BottomBar();
    }
    this.ui.log.write(String(message));
  }

  static progress(message: string) {
    this.ui.updateBottomBar(String(message));
  }
}
