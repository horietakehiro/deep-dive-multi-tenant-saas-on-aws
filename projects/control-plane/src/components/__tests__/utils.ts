import { IStateRepository, State } from "../utils";

export class InMemoryStateRepository implements IStateRepository {
  //   private storage: { [key in keyof State]: State[key] };
  private state: Partial<State> = {};
  constructor() {
    // this.storage = {};
    this.state = {};
  }
  public get<T extends State[k], k extends keyof State>(
    key: k,
    defaultValue: T
  ): State[k] {
    const val = this.state[key];
    if (val === undefined) {
      return defaultValue;
    }
    return val as State[k];
  }
  public set<k extends keyof State>(
    key: k,
    value: State[k],
    setState: (value: State[k]) => void
  ): void {
    this.state[key] = value;
    setState(value);
  }
  public remove<k extends keyof State>(key: k): void {
    this.state[key] = undefined;
  }
}
