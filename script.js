const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.querySelector("#contain").appendChild(canvas);
F.createListeners();

var cam = { x: 0, y: 0, z: 1 },
  entities = [];

var colors = [
  "red",
  "blue",
  "magenta",
  "blueviolet",
  "crimson",
  "darkgreen",
  "darkblue",
  "darkred",
  "coral",
  "greenyellow",
  "LightSalmon",
  "hotpink",
  "#222",
];

function reset() {
  entityTemplate = [
    [30, 10, 40, 40],
    [40, 200, 120, 20],
    [50, 400, 80, 40, ["static", "bouncy"]],

    [250, -100, 80, 20],
    [290, 10, 120, 20, ["bouncy"]],
    [220, 200, 40, 40],
    [250, 500, 80, 40, ["static", "bouncy"]],
    [400, -5000, 40, 40],
    [420, -5900, 40, 40],

    [510, 00, 20, 20, ["bouncy"], { vy: 200 }],
    [510, 70, 20, 20, ["bouncy"]],
    [500, 450, 40, 120, ["static", "bouncy"]],

    ...(F.keys.Shift
      ? [
          [10, 10, 120, 10, [], { vx: 200 }],
          [600, 50, 5, 5, ["bouncy"], { vx: -100, vy: -50 }],
          [100, 50, 5, 5, ["bouncy"], { vx: 100, vy: -50 }],
          [300, 500, 5, 5, ["bouncy"], { vy: -1000 }],
          [100, 250, 5, 5, ["bouncy"], { vy: -1000 }],
          [100, 250, 5, 5, ["bouncy"], { vy: -1000 }],
          [100, 250, 5, 5, ["bouncy"], { vy: -1000 }],
          [100, 250, 5, 5, ["bouncy"], { vy: -1000 }],
        ]
      : []),
  ];
  entities = [];
  for (var i in entityTemplate) {
    if (!entityTemplate[i]) {
      continue;
    }

    var entity = {
      x: entityTemplate[i][0],
      y: entityTemplate[i][1],
      w: entityTemplate[i][2],
      h: entityTemplate[i][3],
      vx: 0,
      vy: 0,
      ...(entityTemplate[i][5] || {}),
    };

    if (entityTemplate[i][4]) {
      for (var j in entityTemplate[i][4]) {
        entity[entityTemplate[i][4][j]] = true;
      }
    }

    entities.push(entity);
  }
}

function render() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  const scale = Math.min(canvas.width, canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#181818";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  ctx.translate(-cam.x, -cam.y);

  ctx.lineWidth = 4 / cam.z;
  ctx.strokeRect(0, 0, scale, scale);

  ctx.beginPath();
  ctx.moveTo(scale / 2, 0);
  ctx.lineTo(scale / 2, scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, scale / 2);
  ctx.lineTo(scale, scale / 2);
  ctx.stroke();

  for (var i in entities) {
    var entity = entities[i];
    ctx.fillStyle = colors[i] || "black";
    ctx.fillRect(entity.x, entity.y, entity.w, entity.h);

    if (entity.static) {
      var hsv = F.hex2hsv(ctx.fillStyle);
      hsv.v -= 10;
      ctx.strokeStyle = F.hsv2hex(hsv);
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      var size = ctx.lineWidth / 2;
      ctx.beginPath();
      ctx.moveTo(entity.x + size, entity.y + size);
      ctx.lineTo(entity.x + entity.w - size, entity.y + entity.h - size);
      ctx.moveTo(entity.x + entity.w - size, entity.y + size);
      ctx.lineTo(entity.x + size, entity.y + entity.h - size);
      ctx.stroke();
    }

    if (entity.bouncy) {
      ctx.fillStyle = "white";
      var radius = Math.min(entity.w, entity.h, 10) * 0.3;
      ctx.beginPath();
      ctx.ellipse(
        entity.x + entity.w / 2,
        entity.y + entity.h / 2,
        radius,
        radius,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  ctx.restore();
}

function update(mod) {
  var speed = (2000 * mod) / F.border(2 ** cam.z, 0.01, 10);
  if (F.keys.w ^ F.keys.s) {
    if (F.keys.w) {
      cam.y -= speed;
    } else {
      cam.y += speed;
    }
  }
  if (F.keys.a ^ F.keys.d) {
    if (F.keys.a) {
      cam.x -= speed;
    } else {
      cam.x += speed;
    }
  }
  var zoomSpeed = 2 * mod * cam.z;
  if (F.keys.Minus ^ F.keys.Equal) {
    if (F.keys.Minus) {
      cam.z -= zoomSpeed;
    } else {
      cam.z += zoomSpeed;
    }
  }
  cam.z = F.border(cam.z, 0.1, 100);
  if (F.keys.Digit0) {
    cam = { x: 0, y: 0, z: 1 };
  }

  if (F.keys.r || F.keys.R) {
    reset();
  }

  //* Change speed of everything
  if (F.mouse.left) {
    mod *= (F.mouse.y / canvas.height) * 2 || 1;
  }

  const vy_increase = 1000;
  const vy_max = 1000;
  for (var i in entities) {
    var entity = entities[i];
    if (entity.static) {
      continue;
    }

    entity.vy += vy_increase * mod;
    entity.vy = F.border(entity.vy, -vy_max, vy_max);
  }

  const bounceLoss = 0.6;
  const bounceMin = 100;
  for (var i in entities) {
    var entity = entities[i];
    if (entity.static) {
      continue;
    }

    Other: for (var j in entities) {
      if (i === j) {
        continue;
      }
      var other = entities[j];

      if (
        F.collide.rect2rect(
          {
            ...entity,
            y: entity.y + entity.vy * mod,
            x: entity.x + entity.vx * mod,
          },
          other,
        )
      ) {
        if (entity.vy > 0) {
          entity.y = other.y - entity.h;
        } else {
          entity.y = other.y + other.h;
        }

        if (!(entity.bouncy || other.bouncy)) {
          entity.vy = 0;
          continue Other;
        }

        if (Math.abs(entity.vy) < bounceMin) {
          entity.vy = 0;
        } else {
          entity.vy *= -bounceLoss;
          entity.vy += other.vy || 0;
        }
      }
    }

    entity.x += entity.vx * mod;
    entity.y += entity.vy * mod;
  }
}

function main() {
  if (document.hasFocus()) {
    render();
    update((Date.now() - then) / 1000);
  }
  then = Date.now();
  requestAnimationFrame(main);
}
var then = Date.now();
reset();
main();
