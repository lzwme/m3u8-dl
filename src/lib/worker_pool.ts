import { AsyncResource } from 'node:async_hooks';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { cpus } from 'node:os';
import { Worker } from 'node:worker_threads';

type WorkerPoolCallback<R> = (err: Error | null, result: R, startTime: number) => void;

const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

class WorkerPoolTaskInfo<R> extends AsyncResource {
  startTime = Date.now();
  constructor(public callback: WorkerPoolCallback<R>) {
    super('WorkerPoolTaskInfo');
  }
  done(err: Error | null, result: unknown) {
    this.runInAsyncScope(this.callback, null, err, result, this.startTime);
    this.emitDestroy();
  }
}

export class WorkerPool<T = unknown, R = unknown> extends EventEmitter {
  private workers: Worker[] = [];
  private freeWorkers: Worker[] = [];
  private workerTaskInfo = new Map<Worker, WorkerPoolTaskInfo<R>>();
  private tasks: {
    task: T;
    callback: WorkerPoolCallback<R>;
  }[] = [];
  get totalTask() {
    return this.tasks.length;
  }
  get totalNum() {
    return this.workers.length;
  }
  get freeNum() {
    return this.freeWorkers.length;
  }
  constructor(
    private processorFile: string,
    public numThreads = 0
  ) {
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
        this.workerTaskInfo.delete(worker);
        this.freeWorkers.push(worker);
        this.emit(kWorkerFreedEvent);
        r.done(null, result);
      }
    });

    worker.on('error', err => {
      console.error('worker error', err);
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
    if (this.numThreads < this.workers.length) this.numThreads = this.workers.length;
  }
  runTask(task: T, callback: WorkerPoolCallback<R>) {
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
  removeTask(task: T | ((task: T) => boolean)) {
    const filter = (typeof task === 'function' ? task : (t: T) => t === task) as (t: T) => boolean;
    const count = this.tasks.length;
    this.tasks = this.tasks.filter(item => !filter(item.task));
    return count - this.tasks.length;
  }
  close() {
    for (const worker of this.workers) worker.terminate();
  }
}
