/** Source mapping plugin is needed for node */
require("source-map-support").install();

import * as chalk from "chalk";
import * as chokidar from "chokidar";
import * as esbuild from "esbuild";
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

  taskRunner.registerTask({
    path: ["test", "watch"],
    taskFunction: watchTest,
    description: "Watch test",
  });
  
  taskRunner.registerTask({
    path: ["test", "once"],
    taskFunction: test,
    description: "Test task runner",
  });

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

  const [, , commandLineArguments] = process.argv;

  if (commandLineArguments === undefined) {
    const text = "Charlie's build tooling";
    const textLength = text.length;
    console.log(chalk.cyanBright("#".repeat(textLength + 4)));
    console.log(chalk.cyanBright(`# ${text} #`));
    console.log(chalk.cyanBright("#".repeat(textLength + 4) + "\n"));
    taskRunner.logTasks();
    return;
  }

  const firstCommand = commandLineArguments.split(" ")[0];
  const commandPath = firstCommand.split(TaskRunner.TASK_SEPARATOR);

  await taskRunner.invokeTask(commandPath);
}

async function watchTest() {
  await test();
  console.log(chalk.blue("Watching test..."));
  chokidar.watch("src").on("change", async (path) => {
    console.log(`File triggered rebuild: ${chalk.grey(path)}`);
    await test();
  });
}

async function test() {
  console.log("Building code");

  const buildPath = "build_output/test_output/out.js";
  await esbuild.build({
    bundle: true,
    sourcemap: true,
    entryPoints: ["src/_task_runner_test.js"],
    outfile: buildPath,
    platform: "node",
  });

  console.log("Testing code...");
  const mocha = new Mocha({});

  mocha.addFile(buildPath);

  mocha.run((failures) => {
    for (let k in require.cache) {
      delete require.cache[k];
    }
    process.removeAllListeners("uncaughtException");
    process.once("exit", () => {
      if (failures) {
        console.log("TESTS FAILED");
      } else {
        console.log("TESTS PASSED");
      }

      process.exit(failures);
    });

    mocha.dispose();
  });

  // On failure, this code won't be run
}
