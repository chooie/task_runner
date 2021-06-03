import * as chalk from "chalk";

export const TASK_SEPARATOR = ":";

export function make() {
  const tasks = {};

  return {
    registerTask(task) {
      const { path, dependencies, description, taskFunction } = task;

      if (!Array.isArray(path)) {
        throw new Error(
          `path must be an array, but was '${path}' of type '${typeof path}'`
        );
      }

      if (typeof taskFunction !== "function") {
        throw new Error(
          `taskFunction '${taskFunction}' must be a function, but was '${typeof taskFunction}'`
        );
      }

      if (description && typeof description !== "string") {
        throw new Error(
          `description was set to '${description}' but it was of type '${typeof description}'. It must be of type string`
        );
      }

      if (dependencies && !Array.isArray(dependencies)) {
        throw new Error(
          `dependencies should be an array, but was '${dependencies}' of type '${typeof dependencies}'`
        );
      }

      setNestedTask(tasks, path, {
        path,
        dependencies,
        description,
        taskFunction,
      });
    },
    async invokeTask(path) {
      if (!Array.isArray(path)) {
        throw new Error(
          `path must be an array, but was '${path}' of type '${typeof path}'`
        );
      }

      const task = getNestedTask(tasks, path);

      const dependencies = task.dependencies;

      if (dependencies) {
        dependencies.forEach(async (dependencyPath) => {
          await this.invokeTask(dependencyPath);
        });
      }

      await task.taskFunction();
    },

    getTask(path) {
      return getNestedTask(tasks, path);
    },

    logTasks() {
      console.log("Available tasks to run [./tasks.sh <task>]...");
      console.log(chalk.magentaBright(">>>"));

      recursiveLog(tasks, 0, []);
    },
  };
}

function recursiveLog(tasks, level, path) {
  const spacing = level * 2;
  const offset = " ".repeat(spacing) + "  ";

  Object.entries(tasks).forEach(([taskName, value]) => {
    console.log("-".repeat(spacing) + "> " + chalk.bold.blue(taskName));

    const fullPath = [...path, taskName];

    if (value.nestedTasks) {
      recursiveLog(value.nestedTasks, level + 1, fullPath);
      return;
    }

    if (level > 0) {
      console.log(offset + `${chalk.blue(fullPath.join(TASK_SEPARATOR))}`);
    }

    if (value.description) {
      console.log(chalk.green(offset + "-- " + value.description));
    }

    if (value.dependencies) {
      console.log(chalk.bold.magentaBright(offset + "Dependencies:"));
      value.dependencies.forEach((path) => {
        console.log(chalk.magenta(offset + "--> " + path.join(TASK_SEPARATOR)));
      });
    }
    // console.log(chalk.magentaBright(">>>"));
  });
}

export function setNestedTask(object, path, value) {
  const pathLength = path.length;

  let reference = object;
  path.forEach((pathFragment, index) => {
    if (index === pathLength - 1) {
      if (!reference) {
        throw new Error(
          `'${pathFragment}' for path '${path}' was undefined. This could be because you're trying to overwrite a path that is already a task for ${path.slice(
            0,
            path.length - 1
          )}`
        );
      }

      if (reference[pathFragment]) {
        // Should be undefined because we don't want to overwrite a previously defined task
        throw new Error(
          `'${pathFragment}' for path '${path}' was already set. A task or namespace must not overwrite another task or namespace`
        );
      }

      reference[pathFragment] = value;
      return;
    }

    reference[pathFragment] = reference[pathFragment] || {
      is: "namespace",
      nestedTasks: {},
    };
    reference = reference[pathFragment].nestedTasks;
  });
}

export function getNestedTask(object, path) {
  let reference = object;

  path.forEach((pathFragment, index) => {
    if (pathFragment === "") {
      throw new Error(
        `Path fragment was empty in path '${path}'. Did you leave in an extra colon or omit the nested task name?'`
      );
    }

    const o = reference[pathFragment];
    if (!o) {
      throw new Error(
        `No task exists for path '[${path}]' at fragment '${pathFragment}'`
      );
    }

    if (index === path.length - 1 && o.is === "namespace") {
      throw new Error(
        `Path is a namespace at '[${path}]'. You must use the full path to the task`
      );
    }

    if (o.nestedTasks) {
      reference = o.nestedTasks;
      return;
    }
    reference = o;
  });

  return reference;
}

export function setNestedObject(object, path, value) {
  const pathLength = path.length;

  let reference = object;
  path.forEach((pathFragment, index) => {
    if (index === pathLength - 1) {
      reference[pathFragment] = value;
      return;
    }

    reference[pathFragment] = reference[pathFragment] || {};
    reference = reference[pathFragment];
  });
}

export function getNestedObject(object, path) {
  let reference = object;
  path.forEach((pathFragment) => {
    reference = reference[pathFragment];
  });

  return reference;
}
