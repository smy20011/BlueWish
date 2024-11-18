import './style.css' 
import Two from 'two.js'

document.querySelector('#app').innerHTML = `
  <div>
  </div>
`

class Metor {

  speed = 1000;
  fade_out = 0.2;

  /**
   * Constructor
   * @param {Two} two instance of Two library.
   * @param {number} height 
   * @param {number} weight 
   */
  constructor(two, height, weight) {
    this.x = Math.random() * weight;
    this.y = Math.random() * height;
    this.dir = Math.PI * (Math.random() - 0.5) * 2;
    this.lifetime = Math.random();
    this.elapsed = 0;
    this.head = two.makeCircle(this.x, this.y, 5, 1.0);
    this.tail = two.makeLine(this.x, this.y, this.x, this.y);
    this.tail.stroke = two.makeLinearGradient(this.x, this.y, this.x, this.y, new Two.Stop(0, 'white', 0), new Two.Stop(1, 'white', 1));
    this.tail.stroke.units = 'userSpaceOnUse';
    this.tail.linewidth = 10;
    this.tail.opacity = 0.5;
    this.group = two.makeGroup([this.head, this.tail]);
  }

  update(elapsed) {
    this.elapsed += elapsed;
    const newX = this.x + Math.sin(this.dir) * this.elapsed * this.speed;
    const newY = this.y + Math.cos(this.dir) * this.elapsed * this.speed;
    this.head.position.set(newX, newY);
    this.tail.vertices[1].set(newX, newY);
    this.tail.stroke.right.set(newX, newY);

    if (this.elapsed > this.lifetime) {
      this.group.opacity = 1 - (this.elapsed - this.lifetime) / this.fade_out
    }
  }

  vanished() {
    return this.elapsed > this.lifetime + this.fade_out;
  }

  remove() {
    this.group.remove();
  }
}

class Star {
  /**
   * @param {Two} two 
   * @param {number} height 
   * @param {number} width 
   */
  constructor(two, height, width) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    this.minRadius = 1 + Math.random();
    this.maxRadius = 2 + Math.random();
    this.cycle = 0.5 + Math.random() * 2;
    this.star = two.makeCircle(x, y, 3, 1.0);
    this.elapsed = 0;
  }

  update(delta) {
    this.elapsed += delta;
    const factor = Math.sin(this.elapsed / this.cycle) + 0.5;
    const raidus = this.minRadius + factor * (this.maxRadius - this.minRadius);
    this.star.opacity = factor;
    this.star.radius = raidus;
  }
}


function setup() {
  const two = new Two({
    fullscreen: true,
    autostart: true,
  }).appendTo(document.body);

  const height = two.height;
  const width = two.width;
  const background = two.makeRectangle(width / 2, height / 2, width, height);
  background.fill = two.makeLinearGradient(0, height / 8, 0, height / 2, new Two.Stop(0, "black", 1), new Two.Stop(1, "#032144", 1));
  background.fill.units = "userSpaceOnUse";

  const data = {
    "wish": 0,
    "metors": [],
    "stars": [],
  }

  for (let i = 0; i < 40; ++i) {
    data.stars.push(new Star(two, height, width));
  }

  const conn = new WebSocket("wss://jetstream2.us-east.bsky.network/subscribe\?wantedCollections=app.bsky.feed.post");
  conn.onmessage = (ev) => {
    if (ev.data.toLowerCase().includes("wish")) {
      data.wish += 1;
    }
  };
 /*
  setInterval(() => {
    data.wish += 1;
  }, 1000);
  */

  function update() {
    const delta = 1.0 * two.timeDelta / 1000;
    const newMetors = [];
    if (data.wish > 0) {
      data.metors.push(new Metor(two, height, width));
      data.wish -= 1;
    }
    for (const metor of data.metors) {
      metor.update(delta);
      if (metor.vanished()) {
        metor.remove();
      } else {
        newMetors.push(metor);
      }
    }
    data.metors = newMetors;
    for (const star of data.stars) {
      star.update(delta);
    }
  }
  two.bind('update', update);
}

setup();
