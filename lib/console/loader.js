const pc = require("picocolors")
const {pathExistsSync} = require("fs-extra");
const {join} = require("path");
const _dev = pathExistsSync(join(process.cwd(), "ondev.key"));

class loader {
  #msg;
  #info;
  #progress;
  #fullProgress;

  constructor(msg, info, fullProgress = 0) {
    this.#msg = msg;
    this.#info = info;
    this.#progress = 0;
    this.#fullProgress = fullProgress;
    this.#effect();
  }

  #effect() {
    // check dev
    if (_dev) return;

    process.stdout.write("\r")
    process.stdout.write(" ".repeat(100))
    process.stdout.write("\r" +
      pc.bgBlue(pc.white(" LOAD ")) +
      ` ${this.#msg}${this.#info && `: ${this.#info}`} ${this.#progress}/${this.#fullProgress}`
    );
  }

  end() {
    // check dev
    if (_dev) return;

    this.#progress = this.#fullProgress;
    process.stdout.write("\r" +
      pc.bgGreen(pc.black(" DONE ")) +
      ` ${this.#msg}${this.#info && `: ${this.#info}`} ${this.#progress}/${this.#fullProgress} ✔️` +
      "\n"
    );
  }

  update(info, progress, fullProgress) {
    if (info) this.#info = info;
    if (progress) {
      // check if is Number
      if (typeof progress !== "number" && progress.indexOf("+") > -1)
        this.#progress += parseInt(progress.replace("+", ""));
      else
        this.#progress = progress
    }
    if (fullProgress) {
      if (typeof fullProgress !== "number" && fullProgress.indexOf("+") > -1)
        this.#fullProgress += parseInt(fullProgress.replace("+", ""));
      else
        this.#fullProgress = fullProgress
    }
    this.#effect();
  }
}

module.exports = loader;