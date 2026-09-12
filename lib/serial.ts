/**
 * Web Serial 통신. 'use client' 컴포넌트에서만 쓴다.
 * docs/reference의 원본 HTML이 없어 baudRate 115200과
 * cancel → inputDone 대기 → releaseLock 순서만 지켜 새로 짰다.
 */

export type SerialState = 'closed' | 'connecting' | 'connected' | 'reading' | 'lost';

type Handlers = {
  onLine: (line: string) => void;
  onState: (state: SerialState, message?: string) => void;
};

/** 줄 단위로 잘라 주는 변환기 */
class LineBreakTransformer implements Transformer<string, string> {
  private buffer = '';

  transform(chunk: string, controller: TransformStreamDefaultController<string>) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? '';
    for (const line of lines) controller.enqueue(line);
  }

  flush(controller: TransformStreamDefaultController<string>) {
    if (this.buffer) controller.enqueue(this.buffer);
  }
}

export class EzmakerSerial {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private inputDone: Promise<void> | null = null;
  private keepReading = false;

  constructor(private handlers: Handlers) {}

  static get supported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /** 이미 허락받은 포트가 있으면 다시 잡는다 */
  async reconnect(): Promise<boolean> {
    if (!EzmakerSerial.supported) return false;
    const ports = await navigator.serial.getPorts();
    if (ports.length === 0) return false;
    await this.open(ports[0]);
    return true;
  }

  async connect(): Promise<void> {
    if (!EzmakerSerial.supported) throw new Error('이 브라우저는 장치 연결을 지원하지 않아요');
    this.handlers.onState('connecting');
    const port = await navigator.serial.requestPort();
    await this.open(port);
  }

  private async open(port: SerialPort): Promise<void> {
    await port.open({ baudRate: 115200 });
    this.port = port;
    navigator.serial.addEventListener('disconnect', this.onDisconnect);
    this.handlers.onState('connected');
  }

  private onDisconnect = (event: Event) => {
    if ((event as unknown as { target: SerialPort }).target !== this.port) return;
    this.keepReading = false;
    this.port = null;
    this.handlers.onState('lost', '연결 끊김');
  };

  start(): void {
    if (!this.port || this.keepReading) return;
    this.keepReading = true;
    this.handlers.onState('reading');
    void this.loop();
  }

  private async loop(): Promise<void> {
    while (this.keepReading && this.port?.readable) {
      const decoder = new TextDecoderStream();
      // 읽기를 멈출 때 이 약속이 끝나기를 기다려야 포트가 잠기지 않는다
      // Web Serial 타입과 TextDecoderStream 타입의 청크 타입이 어긋나 한 번 좁혀 준다
      const writable = decoder.writable as unknown as WritableStream<Uint8Array>;
      this.inputDone = this.port.readable.pipeTo(writable).catch(() => {});
      const lines = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));
      this.reader = lines.getReader();

      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) this.handlers.onLine(value);
        }
      } catch {
        // 읽는 중 끊긴 경우. 아래 정리 순서를 그대로 탄다
      } finally {
        try {
          this.reader.releaseLock();
        } catch {
          /* 이미 풀렸으면 넘어간다 */
        }
        this.reader = null;
        await this.inputDone;
        this.inputDone = null;
      }
    }
  }

  /** 순서가 중요하다: cancel → inputDone 대기 → releaseLock */
  async stop(): Promise<void> {
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        /* 이미 닫혔으면 넘어간다 */
      }
    }
    if (this.inputDone) await this.inputDone;
    if (this.port) this.handlers.onState('connected');
  }

  async disconnect(): Promise<void> {
    await this.stop();
    if (this.port) {
      try {
        await this.port.close();
      } catch {
        /* 이미 닫혔으면 넘어간다 */
      }
    }
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      navigator.serial.removeEventListener('disconnect', this.onDisconnect);
    }
    this.port = null;
    this.handlers.onState('closed');
  }
}
