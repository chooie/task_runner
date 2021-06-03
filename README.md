# Task runner

Create a hierarchy of tasks.

<img
  src="assets/task_console_output.png"
  alt="drawing"
  width="300"
/>

## Run it

`./tasks.sh`

## Example setup

```js
import * as chalk from "chalk";
import Mocha from "mocha";

import * as TaskRunner from "./task_runner.js";

main()
  .then(() => {
    console.log(chalk.bold.green("DONE!"));
  })
  .catch((error) => {
    console.log(chalk.red(error.message));

    const stackMessage = error.stack.replace("Error: " + error.message, "");
    console.error(stackMessage);
  });

async function main() {
  const taskRunner = TaskRunner.make();

  registerTasks(taskRunner);

  await readTaskFromCommandLineAndInvokeIt(taskRunner);
}

function registerTasks(taskRunner) {
  taskRunner.registerTask({
    path: ["nested", "task1"],
    taskFunction: () => {
      console.log("Ran task 1");
    },
    description: "Test nested stuff 1",
  });

  taskRunner.registerTask({
    path: ["nested", "task2"],
    dependencies: [["nested", "task1"]],
    taskFunction: () => {
      console.log("Ran task 2");
    },
    description: "Test nested stuff 2",
  });

  taskRunner.registerTask({
    path: ["nested", "task3"],
    dependencies: [["nested", "task2"]],
    taskFunction: () => {
      console.log("Ran task 3");
    },
    description: "Test nested stuff 3",
  });

  taskRunner.registerTask({
    path: ["nested", "deep", "task"],
    dependencies: [["nested", "task2"]],
    taskFunction: () => {
      console.log("Ran task 3");
    },
    description: "Test nested stuff 4",
  });

  taskRunner.registerTask({
    path: ["root-path"],
    taskFunction: () => {
      console.log("Ran root!");
    },
  });
}

async function readTaskFromCommandLineAndInvokeIt(taskRunner) {
  const [, , commandLineArguments] = process.argv;

  if (commandLineArguments === undefined) {
    logCharlieLogo();
    taskRunner.logTasks();
    return;
  }

  const firstCommand = commandLineArguments.split(" ")[0];
  const commandPath = firstCommand.split(TaskRunner.TASK_SEPARATOR);

  await taskRunner.invokeTask(commandPath);

  function logCharlieLogo() {
    const text = "Charlie's build tooling";
    const textLength = text.length;
    console.log(chalk.cyanBright("#".repeat(textLength + 4)));
    console.log(chalk.cyanBright(`# ${text} #`));
    console.log(chalk.cyanBright("#".repeat(textLength + 4) + "\n"));
  }
}
```
