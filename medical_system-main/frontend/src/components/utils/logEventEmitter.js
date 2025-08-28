// src/utils/logEventEmitter.js
const EMITTER_KEY = '__MY_APP_LOG_EMITTER__';

if (!window[EMITTER_KEY]) {
  console.log('--- [1] 방송국 설립 ---');
  window.myAppEmitterId = Math.random(); 

  window[EMITTER_KEY] = {
    events: {},
    getId: () => window.myAppEmitterId, 
    on(event, listener) {
      console.log(`--- [4] OCS 페이지가 "${event}" 방송을 듣기 시작합니다. ---`);
      if (!this.events[event]) { this.events[event] = []; }
      this.events[event].push(listener);
    },
    emit(event, data) {
      console.log(`--- [6] EMR 페이지가 "${event}" 신호를 보냅니다! ---`);
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(data));
      } else {
        console.error('--- [!] 신호를 보냈지만, 듣는 곳이 없습니다! ---');
      }
    },
    off(event, listener) {
      console.log(`--- [!] "${event}" 방송 듣기를 중단합니다. ---`);
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(l => l !== listener);
      }
    }
  };
} else {
  console.log('--- [!] 이미 설립된 방송국을 사용합니다. ---');
}

module.exports = window[EMITTER_KEY];