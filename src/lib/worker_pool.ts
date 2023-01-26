import { EventEmitter } from 'node:events';
import { AsyncResource } from 'node:async_hooks';
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { existsSync } from 'node:fs';

const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

class WorkerPoolTaskInfo<R> extends AsyncResource {
  constructor(public callback: (err: Error | null, result: R) => void) {
    super('WorkerPoolTaskInfo');
    this.callback = callback;
  }

  done(err: Error | null, result: unknown) {
    this.runInAsyncScope(this.callback, null, err, result);
    this.emitDestroy();
  }
}

export class WorkerPool<T = unknown, R = unknown> extends EventEmitter {
  private workers: Worker[] = [];
  private freeWorkers: Worker[] = [];
  private workerTaskInfo = new Map<Worker, WorkerPoolTaskInfo<R>>();
  private tasks: {
    task: T;
    callback: (err: Error | null, result: R) => void;
  }[] = [];
  constructor(private processorFile: string, public numThreads = 0) {
    super();

    numThreads = +numThreads || cpus().length;

    for (let i = 0; i < numThreads; i++) this.addNewWorker(processorFile);

    // 每当发出 kWorkerFreedEvent 时，调度队列中待处理的下一个任务（如果有）。
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const item = this.tasks.shift();
        if (item) this.runTask(item.task, item.callback);
      }
    });
  }

  addNewWorker(processorFile = this.processorFile) {
    if (!existsSync(processorFile)) {
      throw Error(`Not Found: ${processorFile}`);
    }

    const worker = new Worker(processorFile);

    worker.on('message', (result: R) => {
      // 如果成功：调用传递给`runTask`的回调，删除与Worker关联的`TaskInfo`，并再次将其标记为空闲。
      const r = this.workerTaskInfo.get(worker);
      if (r) {
        r.done(null, result);
        this.workerTaskInfo.delete(worker);
        this.freeWorkers.push(worker);
        this.emit(kWorkerFreedEvent);
      }
    });

    worker.on('error', err => {
      // 如果发生未捕获的异常：调用传递给 `runTask` 并出现错误的回调。
      const r = this.workerTaskInfo.get(worker);
      if (r) {
        r.done(err, null);
        this.workerTaskInfo.delete(worker);
      } else this.emit('error', err);

      // 从列表中删除 Worker 并启动一个新的 Worker 来替换当前的 Worker
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.addNewWorker();
    });

    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  runTask(task: T, callback: (err: Error | null, result: R) => void) {
    if (this.freeWorkers.length === 0) {
      this.tasks.push({ task, callback });
      return;
    }

    const worker = this.freeWorkers.pop();
    if (worker) {
      this.workerTaskInfo.set(worker, new WorkerPoolTaskInfo<R>(callback));
      worker.postMessage(task);
    }
  }

  close() {
    for (const worker of this.workers) worker.terminate();
  }
}
