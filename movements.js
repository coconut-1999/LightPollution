// Script to allow movements upon click of an object  
AFRAME.registerComponent('change-on-click', {
    schema: {
        target: {type: 'vec3'}
    },
    init: function () {
        var el = this.el;  // Reference to the entity with this component (i.e., the box)
        var player = document.querySelector('#player');  // Reference to the player entity
        var target = this.data.target;  // The target position

        this.el.addEventListener('click', function () {
            // Fade out the entire scene to black
            player.setAttribute('animation__fadeout', {
                property: 'material.opacity',
                to: 0,
                dur: 1000,
                easing: 'linear'
            });

            // Move the player's position to the new target location
            setTimeout(function() {
                player.setAttribute('position', target);
            }, 500); // Adjust timing as needed to synchronize with fade-out

            // Fade in the scene to reveal the new position
            player.setAttribute('animation__fadein', {
                property: 'material.opacity',
                to: 1,
                startEvents: 'animationcomplete__fadeout',
                dur: 1000,
                easing: 'linear'
            });
        });
    }
});


//change size and color when hovering over the box
AFRAME.registerComponent('hover-effect', {
    schema: {
      hoverColor: {type: 'color', default: '#FF0000'},  // Default hover color is red
      scaleIncrement: {type: 'number', default: 1.2}   // Default scale increment is 20%
    },

    init: function () {
      var el = this.el;
      var data = this.data;
      var originalColor = el.getAttribute('color');
      var originalScale = el.getAttribute('scale');

      el.addEventListener('mouseenter', function () {
        // Animate scale increase
        el.setAttribute('animation__scale', {
          property: 'scale',
          to: {
            x: originalScale.x * data.scaleIncrement,
            y: originalScale.y * data.scaleIncrement,
            z: originalScale.z * data.scaleIncrement
          },
          dur: 300,  // Animation duration in milliseconds
          easing: 'easeOutElastic'  // Easing function for smooth animation
        });

        // Change color to hover color
        el.setAttribute('color', data.hoverColor);
      });

      el.addEventListener('mouseleave', function () {
        // Revert scale back to original size immediately
        el.setAttribute('animation__scale', {
          property: 'scale',
          to: {
            x: el.getAttribute('scale').x / data.scaleIncrement,
            y: el.getAttribute('scale').y / data.scaleIncrement,
            z: el.getAttribute('scale').z / data.scaleIncrement,
          },
          dur: 300,  // Animation duration in milliseconds
          easing: 'easeOutElastic'  // Easing function for smooth animation
        });

        // Revert color back to original immediately
        el.setAttribute('color', originalColor);
      });
    }
  });

//handle sounds and lights from different scenes
AFRAME.registerComponent('scene-manager', {
    init: function () {
        var player = document.querySelector('#player');
        var atacamaLights = document.querySelector('#atacama-lights');
        var atacamaSound = document.querySelector('#atacama-sound');
        var muebLights = document.querySelector('#mueb-lights');
        var muebSound = document.querySelector('#mueb-sound');
        var alpsLights = document.querySelector('#alps-lights');
        var alpsSound = document.querySelector('#alps-sound');

        // Example logic: Listen for player position changes and activate/deactivate lights and sounds accordingly
        player.addEventListener('componentchanged', function (event) {
            if (event.detail.name === 'position') {
                var playerPosition = player.getAttribute('position');

              
                // Hide environment entity when not in Atacama scene
                var environment = document.querySelector('a-entity[environment]');
                if (playerPosition.x > 100) {
                    environment.setAttribute('visible', false);
                }
              
                // Example condition based on player's position
                if (playerPosition.x <= 100) {
                    // Activate Atacama lights and sound
                    atacamaLights.setAttribute('light', 'intensity', 4);
                    atacamaSound.setAttribute('sound', 'volume', 1.0);
                    environment.setAttribute('visible', true);

                    // Deactivate Muenchberg and Alps lights and sound (if needed)
                    muebLights.setAttribute('light', 'intensity', 0);
                    muebSound.setAttribute('sound', 'volume', 0);
                    alpsLights.setAttribute('light', 'intensity', 0);
                    alpsSound.setAttribute('sound', 'volume', 0);
                } else if (playerPosition.x > 100 && playerPosition.x <= 350) {
                    // Activate Muenchberg lights and sound
                    muebLights.setAttribute('light', 'intensity', 0.6);
                    muebSound.setAttribute('sound', 'volume', 1.0);

                    // Deactivate Atacama and Alps lights and sound (if needed)
                    atacamaLights.setAttribute('light', 'intensity', 0);
                    atacamaSound.setAttribute('sound', 'volume', 0);
                    alpsLights.setAttribute('light', 'intensity', 0);
                    alpsSound.setAttribute('sound', 'volume', 0);
                } else if (playerPosition.x > 350) {
                    // Activate Alps lights and sound
                    alpsLights.setAttribute('light', 'intensity', 0.6);
                    alpsSound.setAttribute('sound', 'volume', 1.0);

                    // Deactivate Atacama and Muenchberg lights and sound (if needed)
                    atacamaLights.setAttribute('light', 'intensity', 0);
                    atacamaSound.setAttribute('sound', 'volume', 0);
                    muebLights.setAttribute('light', 'intensity', 0);
                    muebSound.setAttribute('sound', 'volume', 0);
                }
            }
        });
    }
});

//Add random walk for Llama
AFRAME.registerComponent('random-walk', {
  init: function () {
    this.direction = new THREE.Vector3(); // Vector to store direction
    this.walkSpeed = 0.001; // Adjust speed as needed
    this.rotationSpeed = 0.1; // Adjust rotation speed as needed
    this.randomizeDirection(); // Start with a random direction

    // Set boundaries
    this.minX = -30; // Adjust as needed
    this.maxX = 30; // Adjust as needed
    this.minZ = -30; // Adjust as needed
    this.maxZ = 30; // Adjust as needed

    // Minimum distance to player
    this.minDistanceToPlayer = 5;

    // Random break variables
    this.isWalking = true; // Flag to track walking state
    this.breakDuration = this.getRandomBreakDuration(); // Initial break duration
    this.breakTimer = 0; // Timer to count break duration

    // Reference to sound entity
    this.soundEntity = document.querySelector('#llama-sound');

    // Reference to player entity
    this.playerEntity = document.querySelector('#player');
  },

  tick: function (time, delta) {
    if (this.isWalking) {
      // Move the entity along its current direction
      this.el.object3D.position.addScaledVector(this.direction, this.walkSpeed * delta);

      // Check boundaries and adjust position if needed
      this.checkBounds();

      // Check distance to player
      if (this.playerEntity) {
        const distanceToPlayer = this.el.object3D.position.distanceTo(this.playerEntity.object3D.position);
        if (distanceToPlayer < this.minDistanceToPlayer) {
          // Move away from player
          const awayDirection = new THREE.Vector3().subVectors(this.el.object3D.position, this.playerEntity.object3D.position).normalize();
          this.el.object3D.position.addScaledVector(awayDirection, this.minDistanceToPlayer - distanceToPlayer);
        }
      }

      // Rotate the entity to face its movement direction
      this.el.object3D.lookAt(this.el.object3D.position.x + this.direction.x, this.el.object3D.position.y, this.el.object3D.position.z + this.direction.z);

      // Check if it's time to take a break
      if (this.breakTimer >= this.breakDuration) {
        this.isWalking = false;
        this.breakTimer = 0;
        this.breakDuration = this.getRandomBreakDuration();
        
        // Pause sound when stopping
        if (this.soundEntity) {
          this.soundEntity.components.sound.pause();
        }
      } else {
        this.breakTimer += delta / 1000; // Convert milliseconds to seconds
      }
    } else {
      // Llama is taking a break
      // You can add additional behavior during the break if needed

      // After break duration, resume walking
      if (this.breakTimer >= this.breakDuration) {
        this.isWalking = true;
        this.breakTimer = 0;
        this.breakDuration = this.getRandomBreakDuration();
        this.randomizeDirection(); // Randomize direction upon resuming walk
        
        // Resume sound when resuming walking
        if (this.soundEntity) {
          this.soundEntity.components.sound.play();
        }
      } else {
        this.breakTimer += delta / 1000; // Convert milliseconds to seconds
      }
    }
  },

  randomizeDirection: function () {
    // Generate a random direction vector
    this.direction.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
  },

  checkBounds: function () {
    // Ensure entity stays within boundaries
    if (this.el.object3D.position.x < this.minX) {
      this.el.object3D.position.x = this.minX;
      this.randomizeDirection(); // Randomize direction upon hitting boundary
    }
    if (this.el.object3D.position.x > this.maxX) {
      this.el.object3D.position.x = this.maxX;
      this.randomizeDirection();
    }
    if (this.el.object3D.position.z < this.minZ) {
      this.el.object3D.position.z = this.minZ;
      this.randomizeDirection();
    }
    if (this.el.object3D.position.z > this.maxZ) {
      this.el.object3D.position.z = this.maxZ;
      this.randomizeDirection();
    }
  },

  getRandomBreakDuration: function () {
    // Generate a random break duration between 1 to 5 seconds (adjust as needed)
    return Math.random() * 4 + 1; // Random between 1 to 5 seconds
  }
});


