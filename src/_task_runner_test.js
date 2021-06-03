import { assert } from "chai";

import * as TaskRunner from "./task_runner.js";

describe("Task Runner", () => {
  it("can register a task", function () {
    const taskRunner = TaskRunner.make();
    taskRunner.registerTask({ path: ["foo"], taskFunction() {} });
    const foo = taskRunner.getTask(["foo"]);
    assert.deepEqual(foo.path, ["foo"]);
  });

  it("can invoke a task", async () => {
    const taskRunner = TaskRunner.make();
    let called;
    taskRunner.registerTask({
      path: ["foo"],
      taskFunction() {
        called = true;
      },
    });

    await taskRunner.getTask(["foo"]).taskFunction();

    assert.equal(called, true);
  });

  it("can register a nested task", () => {
    let called;

    const path = ["namespace", "foo"];
    const taskRunner = TaskRunner.make();
    taskRunner.registerTask({
      path,
      taskFunction() {
        called = true;
      },
    });
    const foo = taskRunner.getTask(path);
    assert.deepEqual(foo.path, path);
  });

  it("can register a task with dependencies", async () => {
    let called1;
    let called2;
    let called3;

    const path1 = ["task1"];
    const path2 = ["task2"];
    const path3 = ["task3"];
    const taskRunner = TaskRunner.make();
    taskRunner.registerTask({
      path: path1,
      taskFunction() {
        called1 = true;
      },
    });
    taskRunner.registerTask({
      path: path2,
      dependencies: [path1],
      taskFunction() {
        called2 = true;
      },
    });

    taskRunner.registerTask({
      path: path3,
      dependencies: [path2],
      taskFunction() {
        called3 = true;
      },
    });

    await taskRunner.invokeTask(path3);

    assert.equal(called1, true);
    assert.equal(called2, true);
    assert.equal(called3, true);
  });

  it("throws an error when we register a task over another task", () => {
    const taskRunner = TaskRunner.make();
    taskRunner.registerTask({
      path: ["foobar"],
      taskFunction() {
        console.log("foo");
      },
    });

    assert.throws(() => {
      taskRunner.registerTask({
        path: ["foobar"],
        taskFunction() {
          console.log("bar");
        },
      });
    }, "'foobar' for path 'foobar' was already set. A task or namespace must not overwrite another task or namespace");
  });

  it("throws an error when we register a nested task over another task", () => {
    const taskRunner = TaskRunner.make();
    taskRunner.registerTask({
      path: ["foobar"],
      taskFunction() {
        console.log("foo");
      },
    });

    assert.throws(() => {
      taskRunner.registerTask({
        path: ["foobar", "baz"],
        taskFunction() {
          console.log("bar");
        },
      });
    }, "'baz' for path 'foobar,baz' was undefined. This could be because you're trying to overwrite a path that is already a task for foobar");
  });

  it("throws an error when we try to invoke a task that doesn't exist", async () => {
    const taskRunner = TaskRunner.make();
    taskRunner.registerTask({
      path: ["foobar"],
      taskFunction() {},
    });

    await asyncFunctionShouldThrow(async () => {
      await taskRunner.invokeTask(["no-task", "here"]);
    }, "No task exists for path");
  });

  it("can set a nested task", () => {
    const object = {};
    TaskRunner.setNestedTask(object, ["foo", "bar", "baz", "buzz"], "quux");
    assert.deepEqual(object, {
      foo: {
        is: "namespace",
        nestedTasks: {
          bar: {
            is: "namespace",
            nestedTasks: {
              baz: {
                is: "namespace",
                nestedTasks: {
                  buzz: "quux",
                },
              },
            },
          },
        },
      },
    });
  });

  it("can get a nested task", () => {
    const object = {
      foo: {
        is: "namespace",
        nestedTasks: {
          bar: {
            is: "namespace",
            nestedTasks: {
              baz: {
                is: "namespace",
                nestedTasks: {
                  buzz: "quux",
                },
              },
            },
          },
        },
      },
    };
    assert.deepEqual(
      TaskRunner.getNestedTask(object, ["foo", "bar", "baz", "buzz"]),
      "quux"
    );
  });

  it("can set multiple nested tasks", () => {
    const object = {};
    TaskRunner.setNestedTask(object, ["foo", "bar", "baz", "buzz"], "quux");
    TaskRunner.setNestedTask(object, ["foo", "bar", "bass"], "bazz");
    assert.deepEqual(object, {
      foo: {
        is: "namespace",
        nestedTasks: {
          bar: {
            is: "namespace",
            nestedTasks: {
              bass: "bazz",
              baz: {
                is: "namespace",
                nestedTasks: {
                  buzz: "quux",
                },
              },
            },
          },
        },
      },
    });
  });

  it("can set a value", () => {
    const object = {};
    TaskRunner.setNestedObject(object, ["foo"], "bar");
    assert.deepEqual(object, {
      foo: "bar",
    });
  });

  it("can set a nested value", () => {
    const object = {};
    TaskRunner.setNestedObject(object, ["foo", "bar"], "baz");
    assert.deepEqual(object, {
      foo: {
        bar: "baz",
      },
    });
  });

  it("can get a nested value", () => {
    const object = {
      foo: {
        bar: "baz",
      },
    };
    assert.equal(TaskRunner.getNestedObject(object, ["foo", "bar"]), "baz");
  });
});

async function asyncFunctionShouldThrow(fn, shouldStartWith) {
  let caughtError;
  try {
    await fn();
  } catch (error) {
    caughtError = error;
  }

  if (!isError(caughtError)) {
    throw new Error("Expected async function to throw an error, but it didn't");
  }

  const message = caughtError.message;

  if (shouldStartWith) {
    assert.ok(
      message.startsWith(shouldStartWith),
      `Should start with: \n'${shouldStartWith}', but was: \n'${message}'`
    );
  }
}

function isError(object) {
  return (
    object &&
    object.stack &&
    object.message &&
    typeof object.stack === "string" &&
    typeof object.message === "string"
  );
}
