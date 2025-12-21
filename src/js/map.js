// ============================================
// FIREBASE IMPORTS
// ============================================
import { db, storage, auth } from './firebase-config.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js';

// ============================================
// FILE UPLOAD CONSTRAINTS
// ============================================
const MAX_IMAGES = 5;
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024; // 50MB in bytes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png']; // Solo JPEG, JPG y PNG
const ALLOWED_VIDEO_TYPES = ['video/mp4']; // Solo MP4

// ============================================
// GOOGLE MAPS FUNCTIONALITY
// ============================================
// Config: default coordinates (used when there is no saved location)
const DEFAULT_LOCATION = { lat: 19.432608, lng: -99.133209 }; // Mexico City

let map;
let marker;
let geocoder;
let autocomplete;

/**
 * Initialize the map and UI bindings.
 * This function is called by the Google Maps API (callback=initMap).
 */
function initMap() {
  const mapEl = document.getElementById('map');
  const addressInput = document.getElementById('address');

  if (!mapEl || !addressInput) {
    console.error('Map or address input not found in DOM.');
    return;
  }

  if (typeof google === 'undefined' || !google.maps) {
    mapEl.innerText = 'Google Maps failed to load.';
    return;
  }

  geocoder = new google.maps.Geocoder();

  // Create map
  map = new google.maps.Map(mapEl, {
    center: DEFAULT_LOCATION,
    zoom: 14,
    clickableIcons: false,
    gestureHandling: 'auto',
  });

  // Create draggable marker
  marker = new google.maps.Marker({
    position: DEFAULT_LOCATION,
    map,
    draggable: true,
    title: 'Drag to set business location',
  });

  // Populate inputs with default location
  updatePositionInputs(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
  reverseGeocodeAndFill(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);

  // Marker drag handling
  marker.addListener('dragend', () => {
    const pos = marker.getPosition();
    const lat = pos.lat();
    const lng = pos.lng();
    updatePositionInputs(lat, lng);
    reverseGeocodeAndFill(lat, lng);
  });

  // Click map to move marker
  map.addListener('click', (e) => {
    if (!e.latLng) return;
    marker.setPosition(e.latLng);
    map.panTo(e.latLng);
    updatePositionInputs(e.latLng.lat(), e.latLng.lng());
    reverseGeocodeAndFill(e.latLng.lat(), e.latLng.lng());
  });

  // Autocomplete for address input
  autocomplete = new google.maps.places.Autocomplete(addressInput, {
    fields: ['geometry', 'formatted_address', 'address_components'],
  });
  autocomplete.bindTo('bounds', map);

  // When user picks a place from suggestions
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      geocodeAddress(addressInput.value);
      return;
    }

    const loc = place.geometry.location;
    map.panTo(loc);
    map.setZoom(16);
    marker.setPosition(loc);
    updatePositionInputs(loc.lat(), loc.lng());
    document.getElementById('formatted_address').value = place.formatted_address || addressInput.value;
  });

  // If user types a manual address and blurs the field, geocode it
  addressInput.addEventListener('blur', () => {
    const val = addressInput.value && addressInput.value.trim();
    if (!val) return;
    setTimeout(() => {
      if (document.getElementById('formatted_address').value === val) return;
      geocodeAddress(val);
    }, 250);
  });

  // Reset Marker button
  const resetBtn = document.getElementById('resetMapButton');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      marker.setPosition(DEFAULT_LOCATION);
      map.panTo(DEFAULT_LOCATION);
      map.setZoom(14);
      updatePositionInputs(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
      reverseGeocodeAndFill(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
    });
  }

  // Setup file input validation
  setupFileValidation();

  // Form submit handling with Firebase integration
  const form = document.getElementById('businessRegistrationForm');
  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      
      // Verificar si el usuario está autenticado
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showNotification('You must log in to register a business', 'error');
        // Abrir modal de auth si está disponible
        if (window.openAuthModal) {
          window.openAuthModal('login');
        }
        return;
      }
      
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Validate files before submission
      const imageInput = document.getElementById('images');
      const videoInput = document.getElementById('video');

      const imageFiles = imageInput.files || [];
      const videoFiles = videoInput.files || [];
      
      const fileValidation = validateFiles(imageFiles, videoFiles);
      if (!fileValidation.valid) {
        showNotification(fileValidation.message, 'error');
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        // Upload images and video
        showNotification('Uploading files...', 'info');
        const imageUrls = await uploadImages(imageFiles);
        const videoUrl = await uploadVideo(videoFiles[0]); // Only first video

        const fd = new FormData(form);

        // Prepare payload
        const payload = {
          businessName: fd.get('businessName'),
          businessType: fd.get('businessType'),
          ownerName: fd.get('ownerName'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          address: fd.get('address'),
          formatted_address: fd.get('formatted_address'),
          latitude: parseFloat(fd.get('latitude')),
          longitude: parseFloat(fd.get('longitude')),
          description: fd.get('description'),
          website: fd.get('website'),
          images: imageUrls,
          video: videoUrl,
          createdAt: new Date(),
          userId: currentUser.uid,
          userEmail: currentUser.email,
          status: 'pending'
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'places'), payload);
        
        console.log('Business registered successfully with ID:', docRef.id);
        
        // Show success message
        showNotification('Business registered successfully!', 'success');
        
        // Reset form
        form.reset();

        if (imageInput) imageInput.value = '';
        if (videoInput) videoInput.value = '';

        // Reset map
        if (marker && map) {
          marker.setPosition(DEFAULT_LOCATION);
          map.panTo(DEFAULT_LOCATION);
          map.setZoom(14);
          updatePositionInputs(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
          reverseGeocodeAndFill(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
        }
        
        // Optional: redirect to success page
        // window.location.href = '/success.html?id=' + docRef.id;
        
      } catch (error) {
        console.error('Error saving business:', error);
        showNotification('Error saving. Please try again.', 'error');
      } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
}

/**
 * Setup real-time file input validation
 */
function setupFileValidation() {
  const imageInput = document.getElementById('images');
  const videoInput = document.getElementById('video');

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      
      // Check number of images
      if (files.length > MAX_IMAGES) {
        showNotification(`You can only upload maximum ${MAX_IMAGES} images`, 'error');
        e.target.value = ''; // Clear selection
        return;
      }

      // Check image types
      const invalidImages = files.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type));
      if (invalidImages.length > 0) {
        showNotification('Only images in JPEG, JPG or PNG format are allowed.', 'error');
        e.target.value = '';
        return;
      }

      // Show success message
      if (files.length > 0) {
        showNotification(`${files.length} image(s) selected`, 'success');
      }
    });
  }
  if (videoInput) {
    videoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      
      if (!file) return;

      // Check video type
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        showNotification('Only MP4 format videos are allowed', 'error');
        e.target.value = '';
        return;
      }

      // Check video size
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        showNotification(`The video is very large (${sizeMB}MB). Maximum allowed: ${MAX_VIDEO_SIZE_MB}MB`, 'error');
        e.target.value = '';
        return;
      }

      // Show success message
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showNotification(`Selected video (${sizeMB}MB)`, 'success');
    });
  }
}

/**
 * Validate files before upload
 * @param {FileList} images - Image files
 * @param {FileList} videos - Video files
 * @returns {Object} - Validation result
 */
function validateFiles(images, videos) {
  const imageArray = Array.from(images); // ✅ Convertir a array
  const videoArray = Array.from(videos); // ✅ Convertir a array
  
  // Validate number of images
  if (imageArray.length > MAX_IMAGES) {
    return {
      valid: false,
      message: `You can only upload maximum ${MAX_IMAGES} images. You have selected ${imageArray.length}.`
    };
  }

  // Validate image types
  for (const img of imageArray) {
    if (!ALLOWED_IMAGE_TYPES.includes(img.type)) {
      return {
        valid: false,
        message: `Invalid image format: ${img.name}. Only JPEG, JPG or PNG are allowed.`
      };
    }
  }

  // Validate video count (only 1 allowed)
  if (videoArray.length > 1) {
    return {
      valid: false,
      message: 'You can only upload 1 video.'
    };
  }

  // Validate video type and size
  if (videoArray.length === 1) {
    const video = videoArray[0];
    
    if (!ALLOWED_VIDEO_TYPES.includes(video.type)) {
      return {
        valid: false,
        message: `Invalid video format: ${video.name}. Only MP4 videos are allowed.`
      };
    }

    if (video.size > MAX_VIDEO_SIZE_BYTES) {
      const sizeMB = (video.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        message: `The video is very large (${sizeMB}MB). Maximum allowed: ${MAX_VIDEO_SIZE_MB}MB.`
      };
    }
  }

  return { valid: true };
}

/**
 * Upload multiple images to Firebase Storage
 * @param {FileList} files - Array of image files
 * @returns {Promise<string[]>} - Array of download URLs
 */
async function uploadImages(files) {
  if (!files || files.length === 0) return [];
  
  const uploadPromises = [];
  const fileArray = Array.from(files);
  
  for (const file of fileArray) {
    // Create unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileName = `${timestamp}_${randomStr}_${file.name}`;
    
    // Create storage reference
    const storageRef = ref(storage, `business-images/${fileName}`);
    
    // Upload file and get URL
    const uploadPromise = uploadBytes(storageRef, file)
      .then(snapshot => getDownloadURL(snapshot.ref))
      .catch(error => {
        console.error('Error uploading image:', file.name, error);
        return null;
      });
    
    uploadPromises.push(uploadPromise);
  }
  
  // Wait for all uploads to complete
  const urls = await Promise.all(uploadPromises);
  
  // Filter out failed uploads
  return urls.filter(url => url !== null);
}

/**
 * Upload video to Firebase Storage
 * @param {File} file - Video file
 * @returns {Promise<string|null>} - Download URL or null
 */
async function uploadVideo(file) {
  if (!file) return null;
  
  try {
    // Create unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileName = `${timestamp}_${randomStr}_${file.name}`;
    
    // Create storage reference
    const storageRef = ref(storage, `business-videos/${fileName}`);
    
    // Upload file and get URL
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return url;
  } catch (error) {
    console.error('Error uploading video:', error);
    return null;
  }
}

/**
 * Show notification to user
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', or 'info'
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const bgColors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${bgColors[type] || bgColors.info};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Update latitude and longitude inputs shown in the form.
 */
function updatePositionInputs(lat, lng) {
  const latEl = document.getElementById('latitude');
  const lngEl = document.getElementById('longitude');
  if (latEl) latEl.value = (typeof lat === 'number') ? lat.toFixed(6) : lat;
  if (lngEl) lngEl.value = (typeof lng === 'number') ? lng.toFixed(6) : lng;
}

/**
 * Reverse geocode a lat/lng to fill the address input and hidden formatted address.
 */
function reverseGeocodeAndFill(lat, lng) {
  if (!geocoder) return;
  geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } }, (results, status) => {
    if (status === 'OK' && results && results[0]) {
      const best = results[0];
      const addrInput = document.getElementById('address');
      if (addrInput) addrInput.value = best.formatted_address;
      const formatted = document.getElementById('formatted_address');
      if (formatted) formatted.value = best.formatted_address;
    } else {
      console.warn('Reverse geocode failed:', status);
    }
  });
}

/**
 * Geocode an address string -> move marker and center map.
 */
function geocodeAddress(address) {
  if (!geocoder) return;
  geocoder.geocode({ address }, (results, status) => {
    if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
      const loc = results[0].geometry.location;
      map.panTo(loc);
      map.setZoom(16);
      marker.setPosition(loc);
      updatePositionInputs(loc.lat(), loc.lng());
      document.getElementById('formatted_address').value = results[0].formatted_address || address;
    } else {
      console.warn('Geocode was not successful for the following reason: ' + status);
    }
  });
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Expose initMap globally for Google Maps callback
window.initMap = initMap;

// AGREGAR: Cargar Google Maps dinámicamente
function loadGoogleMaps() {
  // Verifica si ya está cargado
  if (window.google && window.google.maps) {
    initMap();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDY0XN6XOMawDujFU_ZnVy1Oyz45PfFWDA&libraries=places&callback=initMap';
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error('Error loading Google Maps');
    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.innerHTML = '<p style="color: red; padding: 20px;">Error al cargar Google Maps. Verifica tu conexión y API key.</p>';
    }
  };
  document.head.appendChild(script);
}

// Cargar el mapa cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadGoogleMaps);
} else {
  loadGoogleMaps();
}