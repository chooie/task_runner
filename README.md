# Task runner

Create a hierarchy of tasks.

```
Available tasks to run [./tasks.sh <task>]...
>>>
> test
--> watch
    test:watch
    -- Watch test
--> once
    test:once
    -- Test task runner
> nested
--> task1
    nested:task1
    -- Test nested stuff 1
--> task2
    nested:task2
    -- Test nested stuff 2
    Dependencies:
    --> nested:task1
--> task3
    nested:task3
    -- Test nested stuff 3
    Dependencies:
    --> nested:task2
--> deep
----> task
      nested:deep:task
      -- Test nested stuff 4
      Dependencies:
      --> nested:task2
> root-path
DONE!
```

## Run it

`./tasks.sh`