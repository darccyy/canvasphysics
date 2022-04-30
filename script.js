const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
F.createListeners();

var cam = { x: 0, y: 0, z: 1 },
  entities = [];

var colors = [
  "red",
  "blue",
  "magenta",
  "yellow",
  "blueviolet",
  "crimson",
  "darkgreen",
  "darkblue",
  "darkred",
];

function reset() {
  entityTemplate = [
    [30, 10, 10, 10],
    [40, 200, 30, 5],
    [50, 400, 20, 10, ["static", "bouncy"]],

    [250, -100, 20, 10],
    [290, 10, 30, 5, ["bouncy"]],
    [220, 200, 10, 10],
    [250, 500, 20, 10, ["static", "bouncy"]],
    [400, -5000, 10, 10],
  ];
  entities = [];
  const entityScale = 4;
  const offsetX = 100;
  for (var i in entityTemplate) {
    var entity = {
      x: entityTemplate[i][0],
      y: entityTemplate[i][1],
      w: entityTemplate[i][2],
      h: entityTemplate[i][3],
      vx: 0,
      vy: 0,
    };
    entity.x += offsetX;
    entity.w *= entityScale;
    entity.h *= entityScale;

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

  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#DDD";
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
      ctx.fillStyle = "lime";
      var radius = Math.min(entity.w, entity.h, 20) * 0.3;
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

  if (F.keys.r) {
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
    if (entity.vy > vy_max) {
      entity.vy = vy_max;
    }
  }

  const bounceLoss = 200;
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
          },
          other,
        )
      ) {
        if (entity.vy > 0) {
          entity.y = other.y - entity.h;
        } else {
          entity.y = other.y + other.h;
        }

        if (!other.bouncy) {
          entity.vy = 0;
          continue Other;
        }

        if (Math.abs(entity.vy) < bounceLoss) {
          entity.vy = 0;
          continue Other;
        }
        entity.vy = bounceLoss - entity.vy;
      }
    }

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
