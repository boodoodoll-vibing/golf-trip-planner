'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ffujefntiqgzlakzvwoz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdWplZm50aXFnemxha3p2d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODQ5MDIsImV4cCI6MjA4NDA2MDkwMn0.VWPINLW6exl5z_WaPgy0zmA4RSUZu9BfHUvJvP03VvQ'
);

const AIRPORTS = [
  { code: "IAH", name: "George Bush Intercontinental" },
  { code: "HOU", name: "William P. Hobby" },
];

const ACTIVITY_TYPES = [
  { type: "golf", icon: "⛳", label: "Golf" },
  { type: "meal", icon: "🍽️", label: "Meal" },
  { type: "activity", icon: "🎯", label: "Activity" },
  { type: "travel", icon: "✈️", label: "Travel" },
  { type: "lodging", icon: "🏨", label: "Lodging" },
  { type: "other", icon: "📌", label: "Other" },
];

const EXPENSE_CATEGORIES = [
  { type: "food", icon: "🍽️", label: "Food & Drinks" },
  { type: "golf", icon: "⛳", label: "Golf" },
  { type: "transport", icon: "🚗", label: "Transport" },
  { type: "lodging", icon: "🏨", label: "Lodging" },
  { type: "entertainment", icon: "🎯", label: "Entertainment" },
  { type: "other", icon: "📌", label: "Other" },
];

// Placeholder Golf Courses
const GOLF_COURSES = [
  {
    id: "memorial-park",
    name: "Memorial Park Golf Course",
    location: "Houston, TX",
    image: "🏌️",
    par: 72,
    yardage: 7345,
    rating: 75.2,
    slope: 136,
    holes: 18,
    website: "https://www.memorialparkgolf.com",
    description: "A championship municipal course that hosts the Houston Open on the PGA Tour. Recently renovated by Tom Doak.",
    amenities: ["Pro Shop", "Driving Range", "Restaurant", "Cart Included"],
    greenFee: "$65-$125",
    scheduledDates: ["2025-02-06", "2025-02-08"],
  },
  {
    id: "golf-club-of-houston",
    name: "Golf Club of Houston",
    location: "Humble, TX",
    image: "⛳",
    par: 72,
    yardage: 7441,
    rating: 76.5,
    slope: 143,
    holes: 18,
    website: "https://www.golfclubofhouston.com",
    description: "Former home of the Shell Houston Open, this Rees Jones design offers a true tour-caliber experience.",
    amenities: ["Pro Shop", "Driving Range", "Locker Room", "Fine Dining"],
    greenFee: "$89-$149",
    scheduledDates: ["2025-02-07"],
  },
  {
    id: "blackhorse",
    name: "BlackHorse Golf Club",
    location: "Cypress, TX",
    image: "🐴",
    par: 72,
    yardage: 7301,
    rating: 74.8,
    slope: 133,
    holes: 36,
    website: "https://www.blackhorsegolfclub.com",
    description: "Two championship courses - North and South - offering diverse challenges through wetlands and wooded terrain.",
    amenities: ["Pro Shop", "Practice Facility", "Bar & Grill", "Event Space"],
    greenFee: "$49-$89",
    scheduledDates: ["2025-02-09"],
  },
  {
    id: "wildcat",
    name: "Wildcat Golf Club",
    location: "Houston, TX",
    image: "🐱",
    par: 72,
    yardage: 7100,
    rating: 74.2,
    slope: 131,
    holes: 36,
    website: "https://www.wildcatgolfclub.com",
    description: "Two Roy Case-designed courses - Highlands and Lakes - featuring stunning elevation changes and water hazards.",
    amenities: ["Pro Shop", "Driving Range", "Restaurant", "Lessons"],
    greenFee: "$55-$95",
    scheduledDates: [],
  },
];

export default function GolfTripPlanner() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [players, setPlayers] = useState([]);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [addingActivityDay, setAddingActivityDay] = useState(null);

  const [trip, setTrip] = useState({
    id: null,
    name: "Houston Golf Trip 2025",
    destination: "Houston, Texas",
    startDate: "2025-02-05",
    endDate: "2025-03-03",
  });
  const [editingTrip, setEditingTrip] = useState(false);
  const [activities, setActivities] = useState([]);

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", phone: "", pin: "" });
  const [authError, setAuthError] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "", handicap: "", avatarUrl: "",
    arrivalDate: "", arrivalTime: "", arrivalAirport: "", arrivalFlight: "",
    departureDate: "", departureTime: "", departureAirport: "", departureFlight: "",
  });

  // Profile picture upload state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [activityForm, setActivityForm] = useState({
    type: "golf", title: "", time: "", location: "", notes: ""
  });

  const [tripForm, setTripForm] = useState({ ...trip });

  // Flight status cache and loading state
  const [flightStatusCache, setFlightStatusCache] = useState({});
  const [flightStatusLoading, setFlightStatusLoading] = useState({});

  // Expense tracking state
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "food",
    payerId: "",
    splitWith: [],
    splitEqually: true,
  });
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseUploading, setExpenseUploading] = useState(false);

  // Golf Courses state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [scorecards, setScorecards] = useState({});

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const mainContentRef = useRef(null);
  const PULL_THRESHOLD = 80;

  // Sync status for realtime connection
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'synced' | 'error'

  // Load saved user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('golfTripUser');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
    }
    setUserLoaded(true);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (userLoaded) {
      if (currentUser) {
        localStorage.setItem('golfTripUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('golfTripUser');
      }
    }
  }, [currentUser, userLoaded]);

  // Only load data after we've checked localStorage
  useEffect(() => {
    if (!userLoaded) return;

    loadData();
    setSyncStatus('connecting');

    // Create channels with proper status handling
    const playersCh = supabase.channel('players-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        console.log('[Realtime] Players changed:', payload.eventType);
        loadPlayers();
      });

    const activitiesCh = supabase.channel('activities-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
        console.log('[Realtime] Activities changed:', payload.eventType);
        loadActivities();
      });

    const tripCh = supabase.channel('trip-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip' }, (payload) => {
        console.log('[Realtime] Trip changed:', payload.eventType);
        loadTrip();
      });

    const expensesCh = supabase.channel('expenses-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        console.log('[Realtime] Expenses changed:', payload.eventType);
        loadExpenses();
      });

    // Subscribe with status callback
    let subscribed = 0;
    const onSubscribed = (status) => {
      if (status === 'SUBSCRIBED') {
        subscribed++;
        if (subscribed === 4) {
          console.log('[Realtime] All channels connected!');
          setSyncStatus('synced');
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('[Realtime] Subscription error:', status);
        setSyncStatus('error');
      }
    };

    playersCh.subscribe(onSubscribed);
    activitiesCh.subscribe(onSubscribed);
    tripCh.subscribe(onSubscribed);
    expensesCh.subscribe(onSubscribed);

    return () => {
      supabase.removeChannel(playersCh);
      supabase.removeChannel(activitiesCh);
      supabase.removeChannel(tripCh);
      supabase.removeChannel(expensesCh);
    };
  }, [userLoaded]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPlayers(), loadTrip(), loadActivities(), loadExpenses()]);
    setLoading(false);
  };

  // Pull-to-refresh handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadPlayers(), loadTrip(), loadActivities(), loadExpenses()]);
    setIsRefreshing(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    // Only enable pull-to-refresh when scrolled to top (check window scroll, not element)
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;

    // Only pull down, with resistance, when at top of page
    if (diff > 0 && scrollTop <= 0) {
      const resistance = 0.4;
      const newDistance = Math.min(diff * resistance, PULL_THRESHOLD * 1.5);
      setPullDistance(newDistance);

      // Prevent default scrolling when pulling down
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, PULL_THRESHOLD]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      handleRefresh();
    }
    touchStartY.current = 0;
    setPullDistance(0);
  }, [pullDistance, isRefreshing, handleRefresh, PULL_THRESHOLD]);

  // Native touch event listeners for pull-to-refresh (passive: false allows preventDefault)
  useEffect(() => {
    const onTouchStart = (e) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (!touchStartY.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;

      if (diff > 0 && scrollTop <= 0) {
        const resistance = 0.4;
        const newDistance = Math.min(diff * resistance, PULL_THRESHOLD * 1.5);
        setPullDistance(newDistance);
        if (diff > 10) {
          e.preventDefault(); // This now works because passive: false
        }
      }
    };

    const onTouchEnd = () => {
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        handleRefresh();
      }
      touchStartY.current = 0;
      setPullDistance(0);
    };

    // Add listeners with passive: false for touchmove
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isRefreshing, pullDistance, handleRefresh, PULL_THRESHOLD]);

  const loadPlayers = async () => {
    const { data, error } = await supabase.from('players').select('*').order('created_at');
    if (!error && data) {
      const mapped = data.map(p => ({
        id: p.id, phone: p.phone, pin: p.pin, name: p.name,
        handicap: p.handicap || "", avatarUrl: p.avatar_url || "",
        arrivalDate: p.arrival_date || "", arrivalTime: p.arrival_time || "",
        arrivalAirport: p.arrival_airport || "", arrivalFlight: p.arrival_flight || "",
        departureDate: p.departure_date || "", departureTime: p.departure_time || "",
        departureAirport: p.departure_airport || "", departureFlight: p.departure_flight || "",
      }));
      setPlayers(mapped);
      if (currentUser) {
        const updated = mapped.find(p => p.id === currentUser.id);
        if (updated) setCurrentUser(updated);
      }
    }
  };

  const loadTrip = async () => {
    const { data, error } = await supabase.from('trip').select('*').limit(1).single();
    if (!error && data) {
      const t = { id: data.id, name: data.name, destination: data.destination, startDate: data.start_date, endDate: data.end_date };
      setTrip(t);
      setTripForm(t);
    }
  };

  const loadActivities = async () => {
    const { data, error } = await supabase.from('activities').select('*').order('day_date').order('time');
    if (!error && data) {
      setActivities(data.map(a => ({
        id: a.id, dayDate: a.day_date, type: a.type, icon: a.icon,
        title: a.title, time: a.time || "", location: a.location || "", notes: a.notes || "",
      })));
    }
  };

  const normalizePhone = (phone) => phone.replace(/\D/g, '');
  const formatPhone = (phone) => {
    const c = normalizePhone(phone);
    return c.length === 10 ? `(${c.slice(0, 3)}) ${c.slice(3, 6)}-${c.slice(6)}` : phone;
  };

  const generateItineraryDays = () => {
    const days = [];
    const start = new Date(trip.startDate + "T00:00:00");
    const end = new Date(trip.endDate + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      days.push({ date: dateStr, label, activities: activities.filter(a => a.dayDate === dateStr) });
    }
    return days;
  };

  const itinerary = generateItineraryDays();

  const getFlightEvents = () => {
    const events = [];
    players.forEach(p => {
      if (p.name && p.arrivalDate) events.push({ type: "arrival", player: p.name, avatarUrl: p.avatarUrl, date: p.arrivalDate, time: p.arrivalTime, airport: p.arrivalAirport, flight: p.arrivalFlight });
      if (p.name && p.departureDate) events.push({ type: "departure", player: p.name, avatarUrl: p.avatarUrl, date: p.departureDate, time: p.departureTime, airport: p.departureAirport, flight: p.departureFlight });
    });
    return events.sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  };

  const isProfileComplete = (p) => !!p.name;
  const hasFlightInfo = (p) => !!(p.arrivalDate || p.departureDate);
  const completedProfiles = players.filter(isProfileComplete).length;

  // Fetch flight status from API
  const fetchFlightStatus = async (flightNumber, flightDate) => {
    if (!flightNumber || flightStatusCache[flightNumber] || flightStatusLoading[flightNumber]) return;

    setFlightStatusLoading(prev => ({ ...prev, [flightNumber]: true }));

    try {
      // Note: Free tier doesn't support flight_date, only queries today's flights
      const url = `/api/flight-status?flightIata=${encodeURIComponent(flightNumber)}`;

      const response = await fetch(url);
      const data = await response.json();

      setFlightStatusCache(prev => ({ ...prev, [flightNumber]: data }));
    } catch (error) {
      console.error('Failed to fetch flight status:', error);
      setFlightStatusCache(prev => ({
        ...prev,
        [flightNumber]: { status: 'error', statusLabel: 'Unknown', error: true }
      }));
    } finally {
      setFlightStatusLoading(prev => ({ ...prev, [flightNumber]: false }));
    }
  };

  // Fetch flight statuses when players change
  useEffect(() => {
    if (!userLoaded || !players.length) return;

    players.forEach(player => {
      if (player.arrivalFlight) {
        fetchFlightStatus(player.arrivalFlight, player.arrivalDate);
      }
      if (player.departureFlight) {
        fetchFlightStatus(player.departureFlight, player.departureDate);
      }
    });
  }, [players, userLoaded]);

  // Get flight status from cache (with styling)
  const getFlightStatus = (flightNumber) => {
    if (!flightNumber) return null;

    const cached = flightStatusCache[flightNumber];
    const isLoading = flightStatusLoading[flightNumber];

    if (isLoading) {
      return { label: "Checking...", color: "text-gray-500 dark:text-gray-400 dark:text-gray-500", bg: "bg-gray-50", loading: true };
    }

    if (!cached) {
      return { label: "—", color: "text-gray-400 dark:text-gray-500", bg: "bg-gray-50" };
    }

    // Map API response to display format
    const statusColors = {
      scheduled: { label: cached.statusLabel || "Scheduled", color: "text-blue-600", bg: "bg-blue-50" },
      active: { label: "In Flight", color: "text-green-600", bg: "bg-green-50" },
      landed: { label: "Landed", color: "text-green-600", bg: "bg-green-50" },
      cancelled: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50" },
      diverted: { label: "Diverted", color: "text-yellow-600", bg: "bg-yellow-50" },
      incident: { label: "Incident", color: "text-red-600", bg: "bg-red-50" },
      not_found: { label: "Not Found", color: "text-gray-500 dark:text-gray-400 dark:text-gray-500", bg: "bg-gray-50" },
      error: { label: "Unknown", color: "text-gray-500 dark:text-gray-400 dark:text-gray-500", bg: "bg-gray-50" },
    };

    const base = statusColors[cached.status] || statusColors.scheduled;

    // Add delay info if available
    let label = base.label;
    const delay = cached.arrivalDelay || cached.departureDelay;
    if (delay && delay > 0 && cached.status !== 'cancelled') {
      label = `Delayed ${delay}min`;
      return { ...base, label, color: "text-yellow-600", bg: "bg-yellow-50", delay };
    }

    // Add gate/terminal info
    return {
      ...base,
      label,
      gate: cached.arrivalGate || cached.departureGate,
      terminal: cached.arrivalTerminal || cached.departureTerminal,
      isMock: cached.isMock,
    };
  };

  const handleRegister = async () => {
    setAuthError("");
    const phone = normalizePhone(authForm.phone);
    if (phone.length < 10) { setAuthError("Enter a valid 10-digit phone"); return; }
    if (authForm.pin.length !== 4) { setAuthError("PIN must be 4 digits"); return; }
    if (!authForm.name.trim()) { setAuthError("Enter your name"); return; }
    if (players.find(p => normalizePhone(p.phone) === phone)) { setAuthError("Phone already registered"); return; }

    const { data, error } = await supabase.from('players').insert({ phone, pin: authForm.pin, name: authForm.name.trim() }).select().single();

    if (error) {
      setAuthError("Registration failed: " + error.message);
      return;
    }

    setCurrentUser({ id: data.id, phone: data.phone, pin: data.pin, name: data.name, handicap: "", arrivalDate: "", arrivalTime: "", arrivalAirport: "", arrivalFlight: "", departureDate: "", departureTime: "", departureAirport: "", departureFlight: "" });
    setAuthForm({ name: "", phone: "", pin: "" });
    await loadPlayers();
  };

  const handleLogin = () => {
    setAuthError("");
    const phone = normalizePhone(authForm.phone);
    if (phone.length < 10) { setAuthError("Enter a valid 10-digit phone"); return; }
    if (authForm.pin.length !== 4) { setAuthError("PIN must be 4 digits"); return; }
    const player = players.find(p => normalizePhone(p.phone) === phone);
    if (!player) { setAuthError("Phone not found. Register first?"); return; }
    if (player.pin !== authForm.pin) { setAuthError("Incorrect PIN"); return; }
    setCurrentUser(player);
    setAuthForm({ name: "", phone: "", pin: "" });
  };

  const handleLogout = () => {
    localStorage.removeItem('golfTripUser');
    setCurrentUser(null);
    setCurrentView("dashboard");
  };

  const startEditingProfile = (player) => {
    setProfileForm({
      name: player.name || "", handicap: player.handicap || "", avatarUrl: player.avatarUrl || "",
      arrivalDate: player.arrivalDate || "", arrivalTime: player.arrivalTime || "",
      arrivalAirport: player.arrivalAirport || "", arrivalFlight: player.arrivalFlight || "",
      departureDate: player.departureDate || "", departureTime: player.departureTime || "",
      departureAirport: player.departureAirport || "", departureFlight: player.departureFlight || "",
    });
    setAvatarPreview(player.avatarUrl || null);
    setAvatarFile(null);
    setEditingPlayerId(player.id);
  };

  const saveProfile = async () => {
    console.log('saveProfile called!', { avatarFile, editingPlayerId, profileForm });

    let avatarUrl = profileForm.avatarUrl;

    // Upload new avatar if selected
    if (avatarFile) {
      const fileName = `avatars/${editingPlayerId}_${Date.now()}.${avatarFile.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')  // Use existing receipts bucket
        .upload(fileName, avatarFile);

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        alert('Failed to upload photo: ' + uploadError.message);
      }
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        avatarUrl = urlData?.publicUrl;
        console.log('Avatar uploaded successfully:', avatarUrl);
      }
    }

    const { error: updateError } = await supabase.from('players').update({
      name: profileForm.name, handicap: profileForm.handicap || null,
      avatar_url: avatarUrl || null,
      arrival_date: profileForm.arrivalDate || null, arrival_time: profileForm.arrivalTime || null,
      arrival_airport: profileForm.arrivalAirport || null, arrival_flight: profileForm.arrivalFlight || null,
      departure_date: profileForm.departureDate || null, departure_time: profileForm.departureTime || null,
      departure_airport: profileForm.departureAirport || null, departure_flight: profileForm.departureFlight || null,
    }).eq('id', editingPlayerId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      alert('Failed to save profile: ' + updateError.message);
      return;
    }

    setEditingPlayerId(null);
    setAvatarPreview(null);
    setAvatarFile(null);
    await loadPlayers();
  };

  const cancelEditProfile = () => {
    setEditingPlayerId(null);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  // Handle profile picture selection
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    console.log('handleAvatarChange called!', file);
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setProfileForm({ ...profileForm, avatarUrl: "" });
  };

  const startEditingTrip = () => { setTripForm({ ...trip }); setEditingTrip(true); };

  const saveTrip = async () => {
    await supabase.from('trip').update({
      name: tripForm.name, destination: tripForm.destination,
      start_date: tripForm.startDate, end_date: tripForm.endDate,
    }).eq('id', trip.id);
    setEditingTrip(false);
    await loadTrip();
  };

  const startAddingActivity = (dayIndex) => {
    setActivityForm({ type: "golf", title: "", time: "", location: "", notes: "" });
    setAddingActivityDay(dayIndex);
  };

  const saveActivity = async () => {
    if (!activityForm.title) return;
    const icon = ACTIVITY_TYPES.find(t => t.type === activityForm.type)?.icon || "📌";
    await supabase.from('activities').insert({
      day_date: itinerary[addingActivityDay].date, type: activityForm.type, icon,
      title: activityForm.title, time: activityForm.time || null,
      location: activityForm.location || null, notes: activityForm.notes || null,
    });
    setAddingActivityDay(null);
    await loadActivities();
  };

  const removeActivity = async (activityId) => {
    await supabase.from('activities').delete().eq('id', activityId);
    await loadActivities();
  };

  // ====== EXPENSE FUNCTIONS ======

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, expense_splits(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExpenses(data.map(e => ({
        id: e.id,
        payerId: e.payer_id,
        description: e.description,
        amount: parseFloat(e.amount),
        receiptUrl: e.receipt_url,
        category: e.category || 'other',
        createdAt: e.created_at,
        splits: e.expense_splits?.map(s => ({
          playerId: s.player_id,
          amount: parseFloat(s.amount),
        })) || [],
      })));
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearReceipt = () => {
    setReceiptPreview(null);
    setReceiptFile(null);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      description: "",
      amount: "",
      category: "food",
      payerId: currentUser?.id || "",
      splitWith: players.map(p => p.id),
      splitEqually: true,
    });
    clearReceipt();
    setShowExpenseForm(false);
  };

  const saveExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.payerId) return;

    setExpenseUploading(true);
    let receiptUrl = null;

    try {
      // Upload receipt if exists
      if (receiptFile) {
        const fileName = `${Date.now()}_${receiptFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
          receiptUrl = urlData?.publicUrl;
        }
      }

      // Create expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          payer_id: expenseForm.payerId,
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          receipt_url: receiptUrl,
          category: expenseForm.category,
        })
        .select()
        .single();

      if (!expenseError && expenseData) {
        // Create splits
        const splitAmount = parseFloat(expenseForm.amount) / expenseForm.splitWith.length;
        const splits = expenseForm.splitWith.map(playerId => ({
          expense_id: expenseData.id,
          player_id: playerId,
          amount: splitAmount,
        }));

        await supabase.from('expense_splits').insert(splits);
      }

      resetExpenseForm();
      await loadExpenses();
    } catch (err) {
      console.error('Error saving expense:', err);
    } finally {
      setExpenseUploading(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    await supabase.from('expenses').delete().eq('id', expenseId);
    await loadExpenses();
  };

  // Calculate settlements - who owes whom
  const calculateSettlements = () => {
    const balances = {};

    // Initialize balances for all players
    players.forEach(p => { balances[p.id] = 0; });

    // Process each expense
    expenses.forEach(expense => {
      // Payer paid the full amount, so they're owed that
      if (balances[expense.payerId] !== undefined) {
        balances[expense.payerId] += expense.amount;
      }

      // Each person in the split owes their portion
      expense.splits.forEach(split => {
        if (balances[split.playerId] !== undefined) {
          balances[split.playerId] -= split.amount;
        }
      });
    });

    // Convert balances to settlement transactions
    const settlements = [];
    const debtors = Object.entries(balances).filter(([_, b]) => b < -0.01).map(([id, b]) => ({ id, amount: -b }));
    const creditors = Object.entries(balances).filter(([_, b]) => b > 0.01).map(([id, b]) => ({ id, amount: b }));

    // Match debtors to creditors
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.id,
          to: creditor.id,
          amount: Math.round(amount * 100) / 100,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return settlements;
  };

  const getPlayerName = (playerId) => players.find(p => p.id === playerId)?.name || 'Unknown';
  const getPlayerAvatar = (playerId) => players.find(p => p.id === playerId)?.avatarUrl || null;
  const getCategoryIcon = (cat) => EXPENSE_CATEGORIES.find(c => c.type === cat)?.icon || '📌';

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const myExpenses = expenses.filter(e => e.splits.some(s => s.playerId === currentUser?.id));
  const myTotal = myExpenses.reduce((sum, e) => {
    const mySplit = e.splits.find(s => s.playerId === currentUser?.id);
    return sum + (mySplit?.amount || 0);
  }, 0);

  // Navigation icons mapping
  const navItems = [
    { key: "dashboard", label: "Home", icon: "🏠" },
    { key: "players", label: "Squad", icon: "👥" },
    { key: "courses", label: "Courses", icon: "⛳" },
    { key: "schedule", label: "Schedule", icon: "📅" },
    { key: "costs", label: "Costs", icon: "💰" },
  ];

  if (loading || !userLoaded) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6 animate-pulse-soft">⛳</div>
          <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-4 text-sm font-medium">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen gradient-mesh flex flex-col">
        {/* Beautiful Header */}
        <div className="pt-12 pb-8 px-6 text-center">
          <div className="text-5xl mb-4">⛳</div>
          <h1 className="text-display text-slate-800 dark:text-slate-100">Golf Trip</h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 font-medium">{trip.name}</p>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col justify-center max-w-md mx-auto w-full">
          {/* Auth Toggle Pills */}
          <div className="flex mb-8 p-1.5 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${authMode === "login"
                ? "bg-white dark:bg-slate-800 shadow-md text-slate-800 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200"
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${authMode === "register"
                ? "bg-white dark:bg-slate-800 shadow-md text-slate-800 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200"
                }`}
            >
              Join Trip
            </button>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-6 rounded-3xl animate-fade-in">
            <h2 className="text-heading text-slate-800 dark:text-slate-100 mb-6">
              {authMode === "login" ? "Welcome back" : "Join the adventure"}
            </h2>

            {authMode === "register" && (
              <div className="mb-5">
                <label className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium block mb-2">Your Name</label>
                <input
                  type="text"
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                  placeholder="John Smith"
                  className="input"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium block mb-2">Phone Number</label>
              <input
                type="tel"
                value={authForm.phone}
                onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="input"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium block mb-2">
                {authMode === "register" ? "Create 4-digit PIN" : "Your PIN"}
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={authForm.pin}
                onChange={e => setAuthForm({ ...authForm, pin: e.target.value.replace(/\D/g, '') })}
                placeholder="••••"
                className="input text-center text-3xl tracking-[0.5em] font-bold"
              />
            </div>

            {authError && (
              <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium animate-scale-in">
                {authError}
              </div>
            )}

            <button
              onClick={authMode === "login" ? handleLogin : handleRegister}
              className="btn-primary w-full"
            >
              {authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          {players.length > 0 && (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6">
              👥 {players.length} player{players.length !== 1 ? 's' : ''} already joined
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen gradient-hero"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Glassmorphic Top Header */}
      <header className="glass sticky top-0 z-40 safe-top">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                ⛳
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{trip.name}</h1>
                  {syncStatus === 'connecting' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full animate-pulse">
                      Syncing...
                    </span>
                  )}
                  {syncStatus === 'error' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-semibold rounded-full">
                      Offline
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{trip.destination}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pull-to-Refresh Indicator */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-200"
        style={{
          top: `${Math.min(pullDistance + 60, 140)}px`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
          transform: `translateX(-50%) scale(${Math.min(pullDistance / PULL_THRESHOLD, 1)})`
        }}
      >
        <div className={`w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
          <svg
            className="w-5 h-5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        ref={mainContentRef}
        className="max-w-4xl mx-auto px-4 py-5 pb-28 safe-bottom overflow-y-auto"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {currentView === "dashboard" && (
          <div className="space-y-5 animate-fade-in">
            {/* Hero Trip Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-xl shadow-emerald-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Your Trip</p>
                    <h2 className="text-2xl font-bold mb-3">{trip.name}</h2>
                    <div className="flex flex-col gap-1 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="opacity-80">📍</span> {trip.destination}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="opacity-80">📅</span>
                        {new Date(trip.startDate + "T00:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate + "T00:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={startEditingTrip}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                  >
                    <span className="text-lg">✏️</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Trip Modal */}
            {editingTrip && (
              <div className="glass-card p-5 rounded-2xl animate-scale-in border-2 border-emerald-400">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Edit Trip Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Trip Name</label>
                    <input type="text" value={tripForm.name} onChange={e => setTripForm({ ...tripForm, name: e.target.value })} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Destination</label>
                    <input type="text" value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} className="input mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Start Date</label>
                      <input type="date" value={tripForm.startDate} onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })} className="input mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">End Date</label>
                      <input type="date" value={tripForm.endDate} onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })} className="input mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveTrip} className="btn-primary flex-1">Save Changes</button>
                    <button onClick={() => setEditingTrip(false)} className="btn-secondary px-6">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCurrentView("players")}
                className="glass-card p-4 rounded-2xl text-center interactive"
              >
                <p className="text-2xl font-bold text-emerald-600">{completedProfiles}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mt-1">Players</p>
              </button>
              <button
                onClick={() => setCurrentView("courses")}
                className="glass-card p-4 rounded-2xl text-center interactive"
              >
                <p className="text-2xl font-bold text-teal-600">{GOLF_COURSES.filter(c => c.scheduledDates.length > 0).length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mt-1">Courses</p>
              </button>
              <button
                onClick={() => setCurrentView("costs")}
                className="glass-card p-4 rounded-2xl text-center interactive"
              >
                <p className="text-2xl font-bold text-blue-600">${totalExpenses.toFixed(0)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mt-1">Total</p>
              </button>
            </div>

            {/* Flight Summary */}
            {(() => {
              // Get all arrivals sorted by time (no time = earliest)
              const arrivals = players
                .filter(p => p.name && p.arrivalDate)
                .map(p => ({
                  player: p.name,
                  date: p.arrivalDate,
                  time: p.arrivalTime || '',
                  airport: p.arrivalAirport,
                  flight: p.arrivalFlight,
                  status: getFlightStatus(p.arrivalFlight),
                }))
                .sort((a, b) => {
                  if (!a.time && !b.time) return 0;
                  if (!a.time) return -1;
                  if (!b.time) return 1;
                  return a.time.localeCompare(b.time);
                });

              // Get all departures sorted by time (no time = earliest)
              const departures = players
                .filter(p => p.name && p.departureDate)
                .map(p => ({
                  player: p.name,
                  date: p.departureDate,
                  time: p.departureTime || '',
                  airport: p.departureAirport,
                  flight: p.departureFlight,
                  status: getFlightStatus(p.departureFlight),
                }))
                .sort((a, b) => {
                  if (!a.time && !b.time) return 0;
                  if (!a.time) return -1;
                  if (!b.time) return 1;
                  return a.time.localeCompare(b.time);
                });

              if (arrivals.length === 0 && departures.length === 0) return null;

              return (
                <div className="space-y-4">
                  {/* Arrivals Section */}
                  {arrivals.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-100 dark:border-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✈️</span>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Arrivals</h3>
                          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">{arrivals.length}</span>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {arrivals.map((arr, idx) => (
                          <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-700 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                {arr.player.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{arr.player}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                                  {arr.date && new Date(arr.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  {arr.time && ` • ${arr.time}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{arr.airport || '—'}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{arr.flight || 'No flight #'}</p>
                              </div>
                              {arr.status && (
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${arr.status.bg} ${arr.status.color}`}>
                                  {arr.status.label}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Departures Section */}
                  {departures.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-100 dark:border-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🛫</span>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Departures</h3>
                          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">{departures.length}</span>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {departures.map((dep, idx) => (
                          <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-700 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                {dep.player.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{dep.player}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                                  {dep.date && new Date(dep.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  {dep.time && ` • ${dep.time}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{dep.airport || '—'}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{dep.flight || 'No flight #'}</p>
                              </div>
                              {dep.status && (
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${dep.status.bg} ${dep.status.color}`}>
                                  {dep.status.label}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Squad Preview */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">The Squad</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Live status updates</p>
                  </div>
                  <button
                    onClick={() => setCurrentView("players")}
                    className="text-xs text-emerald-600 font-semibold hover:text-emerald-700"
                  >
                    View All →
                  </button>
                </div>
              </div>

              {players.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="text-4xl block mb-3">👥</span>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">No players yet. Share the invite!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {players.slice(0, 4).map(player => {
                    const isMe = player.id === currentUser.id;
                    return (
                      <div key={player.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt={player.name} className={`w-11 h-11 rounded-xl object-cover shadow-sm ${isMe ? 'ring-2 ring-emerald-400' : ''}`} />
                          ) : (
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${isMe
                              ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                              : "bg-slate-100 text-slate-600 dark:text-slate-300"
                              }`}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {player.name}
                              {isMe && <span className="text-xs text-emerald-500 ml-1.5 font-medium">(You)</span>}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {player.handicap ? `HCP ${player.handicap}` : 'No handicap'}
                              {hasFlightInfo(player) && ' • ✈️ Flight info added'}
                            </p>
                          </div>
                          {isMe && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft"></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {players.length > 4 && (
                    <button
                      onClick={() => setCurrentView("players")}
                      className="w-full p-4 text-center text-sm text-emerald-600 font-medium hover:bg-emerald-50 transition-colors"
                    >
                      +{players.length - 4} more player{players.length - 4 !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setCurrentView("players"); startEditingProfile(currentUser); }}
                className="glass-card p-4 rounded-2xl text-left interactive group"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform origin-left">✏️</span>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Edit Profile</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Update your info</p>
              </button>
              <button
                onClick={() => setCurrentView("schedule")}
                className="glass-card p-4 rounded-2xl text-left interactive group"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform origin-left">📅</span>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">View Schedule</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">See the itinerary</p>
              </button>
            </div>
          </div>
        )}

        {
          currentView === "players" && (
            <div className="space-y-5 animate-fade-in">
              {/* Header */}
              <div className="glass-card p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">The Squad</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{completedProfiles} of {players.length} profiles complete</p>
                  </div>
                  <div className="flex -space-x-2">
                    {players.slice(0, 5).map(p => (
                      p.avatarUrl ? (
                        <img key={p.id} src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                      ) : (
                        <div key={p.id} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                          {p.name.charAt(0)}
                        </div>
                      )
                    ))}
                    {players.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold">
                        +{players.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Your Profile Card */}
              {players.filter(p => p.id === currentUser.id).map(player => (
                <div key={player.id} className={`glass-card rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-lg shadow-emerald-500/10 ${editingPlayerId === player.id ? 'mb-24' : ''}`}>
                  <button
                    onClick={() => editingPlayerId === player.id ? cancelEditProfile() : startEditingProfile(player)}
                    className="w-full p-4 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} className="w-12 h-12 rounded-xl object-cover shadow-lg shadow-emerald-500/30" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
                          {player.name.charAt(0)}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{player.name} <span className="text-xs text-emerald-600 font-semibold">(You)</span></p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                          {player.handicap ? `HCP ${player.handicap}` : 'No handicap set'}
                          {hasFlightInfo(player) && ' • ✈️ Flight info added'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${editingPlayerId === player.id ? 'rotate-90 bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 dark:text-slate-500'}`}>
                      ▶
                    </div>
                  </button>

                  {editingPlayerId === player.id && (
                    <div className="p-5 border-t border-slate-100 dark:border-slate-600 space-y-5 animate-slide-up">
                      {/* Profile Picture Upload */}
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mb-3">Profile Picture</p>
                        {avatarPreview ? (
                          <div className="relative">
                            <img src={avatarPreview} alt="Profile preview" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
                            <button
                              onClick={clearAvatar}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                            <span className="text-2xl mb-1">📷</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Add Photo</span>
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                          </label>
                        )}
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium block mb-1.5">Name</label>
                          <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="input" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium block mb-1.5">Handicap</label>
                          <input type="number" value={profileForm.handicap} onChange={e => setProfileForm({ ...profileForm, handicap: e.target.value })} placeholder="e.g. 12" className="input" />
                        </div>
                      </div>

                      {/* Arrival Card */}
                      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-100">
                        <h4 className="font-semibold text-sm text-sky-700 mb-3 flex items-center gap-2">
                          <span>✈️</span> Arrival Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="date" value={profileForm.arrivalDate} onChange={e => setProfileForm({ ...profileForm, arrivalDate: e.target.value })} className="input text-sm" />
                          <input type="time" value={profileForm.arrivalTime} onChange={e => setProfileForm({ ...profileForm, arrivalTime: e.target.value })} className="input text-sm" />
                          <select value={profileForm.arrivalAirport} onChange={e => setProfileForm({ ...profileForm, arrivalAirport: e.target.value })} className="input text-sm">
                            <option value="">Airport...</option>
                            {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                          </select>
                          <input type="text" value={profileForm.arrivalFlight} onChange={e => setProfileForm({ ...profileForm, arrivalFlight: e.target.value })} placeholder="Flight # (e.g. UA123)" className="input text-sm" />
                        </div>
                      </div>

                      {/* Departure Card */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                        <h4 className="font-semibold text-sm text-amber-700 mb-3 flex items-center gap-2">
                          <span>🛫</span> Departure Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="date" value={profileForm.departureDate} onChange={e => setProfileForm({ ...profileForm, departureDate: e.target.value })} className="input text-sm" />
                          <input type="time" value={profileForm.departureTime} onChange={e => setProfileForm({ ...profileForm, departureTime: e.target.value })} className="input text-sm" />
                          <select value={profileForm.departureAirport} onChange={e => setProfileForm({ ...profileForm, departureAirport: e.target.value })} className="input text-sm">
                            <option value="">Airport...</option>
                            {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                          </select>
                          <input type="text" value={profileForm.departureFlight} onChange={e => setProfileForm({ ...profileForm, departureFlight: e.target.value })} placeholder="Flight # (e.g. UA456)" className="input text-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Other Players */}
              {players.filter(p => p.id !== currentUser.id).length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium px-1">Other Players</p>
                  {players.filter(p => p.id !== currentUser.id).map(player => (
                    <div key={player.id} className="glass-card rounded-2xl p-4 flex items-center gap-4 interactive">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {player.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{player.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {player.handicap ? `HCP ${player.handicap}` : 'No handicap'}
                          {hasFlightInfo(player) && ' • ✈️ Flight info'}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${isProfileComplete(player) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                        {isProfileComplete(player) ? '✓ Ready' : 'Pending'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }

        {currentView === "flights" && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-5 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Flight Logistics</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Track arrivals and departures</p>
            </div>

            {getFlightEvents().length === 0 ? (
              <div className="glass-card p-12 rounded-2xl text-center text-slate-400 dark:text-slate-500">
                <span className="text-4xl block mb-2 opacity-50">✈️</span>
                <p className="font-medium">No flights logged yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Arrivals Section */}
                {getFlightEvents().filter(e => e.type === "arrival").length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 ml-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Arrivals
                    </h3>
                    <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-100/50">
                      {getFlightEvents().filter(e => e.type === "arrival").map((e, i) => (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {e.avatarUrl ? (
                              <img src={e.avatarUrl} alt={e.player} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                                {e.player.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{e.player}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="text-emerald-500">✈️</span> {e.airport} {e.flight && `• ${e.flight}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{e.date}</p>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">{e.time || "TBD"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Departures Section */}
                {getFlightEvents().filter(e => e.type === "departure").length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 ml-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      Departures
                    </h3>
                    <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-100/50">
                      {getFlightEvents().filter(e => e.type === "departure").map((e, i) => (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {e.avatarUrl ? (
                              <img src={e.avatarUrl} alt={e.player} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs">
                                {e.player.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{e.player}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="text-orange-500">🛫</span> {e.airport} {e.flight && `• ${e.flight}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{e.date}</p>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">{e.time || "TBD"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {
          currentView === "schedule" && (
            <div className="space-y-5 animate-fade-in">
              {/* Header */}
              <div className="glass-card p-5 rounded-2xl">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Trip Schedule</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{itinerary.length} days of adventure</p>
              </div>

              {itinerary.map((day, dayIndex) => {
                const breakfast = day.activities.filter(a => a.type === "meal" && a.title?.toLowerCase().includes("breakfast"));
                const golf = day.activities.filter(a => a.type === "golf");
                const lunch = day.activities.filter(a => a.type === "meal" && a.title?.toLowerCase().includes("lunch"));
                const dinner = day.activities.filter(a => a.type === "meal" && a.title?.toLowerCase().includes("dinner"));
                const evening = day.activities.filter(a => a.type === "activity" || a.type === "other");
                const other = day.activities.filter(a => !breakfast.includes(a) && !golf.includes(a) && !lunch.includes(a) && !dinner.includes(a) && !evening.includes(a));

                return (
                  <div key={day.date} className="glass-card rounded-2xl overflow-hidden">
                    {/* Day Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
                      <h4 className="font-bold">{day.label}</h4>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Activity Sections */}
                      {[
                        { items: breakfast, label: "Breakfast", icon: "🍳", color: "amber" },
                        { items: golf, label: "Golf", icon: "⛳", color: "emerald" },
                        { items: lunch, label: "Lunch", icon: "🥪", color: "orange" },
                        { items: dinner, label: "Dinner", icon: "🍽️", color: "rose" },
                        { items: evening, label: "Evening", icon: "🌙", color: "violet" },
                      ].map(section => (
                        <div key={section.label} className={`border-l-4 border-${section.color}-400 pl-4`}>
                          <h5 className={`font-semibold text-sm text-${section.color}-700 mb-2 flex items-center gap-2`}>
                            {section.icon} {section.label}
                          </h5>
                          {section.items.length > 0 ? section.items.map(activity => (
                            <div key={activity.id} className={`flex items-start justify-between p-3 bg-${section.color}-50 rounded-xl mb-2`}>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{activity.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                                  {activity.time && <span className="mr-2">🕐 {activity.time}</span>}
                                  {activity.location && <span>📍 {activity.location}</span>}
                                </p>
                              </div>
                              <button onClick={() => removeActivity(activity.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">✕</button>
                            </div>
                          )) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">No {section.label.toLowerCase()} planned</p>
                          )}
                        </div>
                      ))}

                      {/* Other Activities */}
                      {other.length > 0 && (
                        <div className="border-l-4 border-slate-300 pl-4">
                          <h5 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">📌 Other</h5>
                          {other.map(activity => (
                            <div key={activity.id} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl mb-2">
                              <div className="flex items-start gap-2 flex-1">
                                <span>{activity.icon}</span>
                                <div>
                                  <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{activity.title}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                                    {activity.time && <span className="mr-2">� {activity.time}</span>}
                                    {activity.location && <span>📍 {activity.location}</span>}
                                  </p>
                                </div>
                              </div>
                              <button onClick={() => removeActivity(activity.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">✕</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Activity */}
                      {addingActivityDay === dayIndex ? (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border-2 border-dashed border-emerald-300 mt-4">
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-3">💡 Include "breakfast", "lunch", or "dinner" in titles to auto-categorize</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {ACTIVITY_TYPES.map(t => (
                              <button
                                key={t.type}
                                onClick={() => setActivityForm({ ...activityForm, type: t.type })}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activityForm.type === t.type ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-300"}`}
                              >
                                {t.icon} {t.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={activityForm.title}
                            onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
                            placeholder="What's the plan?"
                            className="input mb-3"
                          />
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <input type="time" value={activityForm.time} onChange={e => setActivityForm({ ...activityForm, time: e.target.value })} className="input text-sm" />
                            <input type="text" value={activityForm.location} onChange={e => setActivityForm({ ...activityForm, location: e.target.value })} placeholder="Location" className="input text-sm" />
                          </div>
                          <div className="flex gap-3">
                            <button onClick={saveActivity} className="btn-primary flex-1">Add Activity</button>
                            <button onClick={() => setAddingActivityDay(null)} className="btn-secondary px-6">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startAddingActivity(dayIndex)}
                          className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 dark:text-slate-500 text-sm font-medium hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                          + Add Activity
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }

        {/* COURSES TAB */}
        {currentView === "courses" && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-5 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Golf Courses</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Explore and track your scores • Tap for details</p>
            </div>

            {/* Course Detail View */}
            {selectedCourse && (
              <div className="glass-card rounded-2xl overflow-hidden border-2 border-emerald-500 animate-slide-up">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white relative">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    ✕
                  </button>
                  <span className="text-5xl block mb-3">{selectedCourse.image}</span>
                  <h3 className="text-2xl font-bold">{selectedCourse.name}</h3>
                  <p className="text-emerald-100 text-sm mt-1 flex items-center gap-1">
                    <span>📍</span> {selectedCourse.location}
                  </p>
                </div>

                <div className="p-5 space-y-6">
                  {/* Course Stats */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { label: "Par", value: selectedCourse.par },
                      { label: "Yards", value: selectedCourse.yardage.toLocaleString() },
                      { label: "Rating", value: selectedCourse.rating },
                      { label: "Slope", value: selectedCourse.slope }
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">{stat.label}</p>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{selectedCourse.description}</p>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.amenities.map((amenity, i) => (
                      <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  {/* Green Fee & Website */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1">Green Fee</p>
                      <p className="font-bold text-emerald-700 text-lg">{selectedCourse.greenFee}</p>
                    </div>
                    <a
                      href={selectedCourse.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2"
                    >
                      <span>🌐</span> Website
                    </a>
                  </div>

                  {/* Scheduled Play Dates */}
                  {selectedCourse.scheduledDates.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-600 pt-5">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <span>📅</span> Scheduled Rounds
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCourse.scheduledDates.map((date, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentView("schedule")}
                            className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-2 border border-emerald-100"
                          >
                            {new Date(date + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            <span className="text-emerald-400">→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scorecard Section */}
                  <div className="border-t border-slate-100 dark:border-slate-600 pt-5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                      <span>🏆</span> Scorecards
                    </h4>

                    {players.length > 0 ? (
                      <div className="space-y-2.5">
                        {players.map(player => {
                          const scoreKey = `${selectedCourse.id}-${player.id}`;
                          const playerScore = scorecards[scoreKey];
                          const isMe = player.id === currentUser?.id;

                          return (
                            <div key={player.id} className={`p-4 rounded-xl transition-all border ${isMe ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {player.avatarUrl ? (
                                    <img src={player.avatarUrl} alt={player.name} className={`w-10 h-10 rounded-xl object-cover ${isMe ? 'ring-2 ring-emerald-400' : ''}`} />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isMe ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-600 dark:text-slate-300'}`}>
                                      {player.name.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{player.name}{isMe && <span className="text-xs text-emerald-600 ml-1">(You)</span>}</p>
                                    {player.handicap && <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">HCP {player.handicap}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isMe ? (
                                    <input
                                      type="number"
                                      placeholder="Score"
                                      value={playerScore || ''}
                                      onChange={(e) => setScorecards({ ...scorecards, [scoreKey]: e.target.value })}
                                      className="w-16 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-center font-bold text-lg text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                  ) : (
                                    <div className="w-16 h-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-xl flex items-center justify-center">
                                      <span className="font-bold text-lg text-slate-400 dark:text-slate-500">{playerScore || '—'}</span>
                                    </div>
                                  )}
                                  {playerScore && (
                                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${parseInt(playerScore) < selectedCourse.par ? 'bg-rose-100 text-rose-600' :
                                      parseInt(playerScore) === selectedCourse.par ? 'bg-sky-100 text-sky-600' :
                                        parseInt(playerScore) <= selectedCourse.par + 10 ? 'bg-amber-100 text-amber-700' :
                                          'bg-slate-100 text-slate-600 dark:text-slate-300'
                                      }`}>
                                      {parseInt(playerScore) < selectedCourse.par ? `${parseInt(playerScore) - selectedCourse.par}` :
                                        parseInt(playerScore) === selectedCourse.par ? 'E' :
                                          `+${parseInt(playerScore) - selectedCourse.par}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-4">No players registered yet</p>
                    )}

                    {/* Leaderboard Summary */}
                    {Object.keys(scorecards).filter(k => k.startsWith(selectedCourse.id)).length > 0 && (
                      <div className="mt-5 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <h5 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                          <span>🏅</span> Leaderboard
                        </h5>
                        <div className="space-y-2">
                          {players
                            .filter(p => scorecards[`${selectedCourse.id}-${p.id}`])
                            .map(p => ({ ...p, score: parseInt(scorecards[`${selectedCourse.id}-${p.id}`]) }))
                            .sort((a, b) => a.score - b.score)
                            .map((player, idx) => (
                              <div key={player.id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-400 text-white' :
                                    idx === 1 ? 'bg-slate-300 text-slate-700 dark:text-slate-200' :
                                      idx === 2 ? 'bg-orange-300 text-orange-800' :
                                        'bg-slate-100 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{player.name}</span>
                                </span>
                                <span className="font-black text-slate-900">{player.score}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Course Grid */}
            <div className="grid grid-cols-1 gap-4">
              {GOLF_COURSES.map(course => (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`glass-card rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex border ${selectedCourse?.id === course.id ? 'ring-2 ring-emerald-500 border-transparent shadow-emerald-500/10' : 'border-slate-100 dark:border-slate-600'
                    }`}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-4xl shrink-0">
                    {course.image}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{course.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>📍</span> {course.location}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-black bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg shrink-0">
                        {course.holes} Holes
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      <span className="flex items-center gap-1">Par <span className="text-slate-600 dark:text-slate-300">{course.par}</span></span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><span className="text-slate-600 dark:text-slate-300">{course.yardage.toLocaleString()}</span> yds</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl text-white shadow-lg">
              <h3 className="font-bold mb-1">🗓️ View Your Schedule</h3>
              <p className="text-blue-100 text-sm mb-4">See when and where you're playing</p>
              <button
                onClick={() => setCurrentView("schedule")}
                className="w-full py-3 bg-white dark:bg-slate-800 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Go to Schedule →
              </button>
            </div>
          </div>
        )}

        {currentView === "costs" && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-5 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Trip Costs</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Track expenses and split fairly</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-5 rounded-2xl text-white">
                <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Trip Total</p>
                <p className="text-3xl font-bold mt-1">${totalExpenses.toFixed(2)}</p>
                <p className="text-emerald-200 text-xs mt-2">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-5 rounded-2xl text-white">
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Your Share</p>
                <p className="text-3xl font-bold mt-1">${myTotal.toFixed(2)}</p>
                <p className="text-blue-200 text-xs mt-2">{myExpenses.length} item{myExpenses.length !== 1 ? 's' : ''}</p>
              </div>
            </div>


            {/* Add Expense Button / Form */}
            {!showExpenseForm ? (
              <button
                onClick={() => {
                  setExpenseForm({
                    ...expenseForm,
                    payerId: currentUser?.id || "",
                    splitWith: players.map(p => p.id),
                  });
                  setShowExpenseForm(true);
                }}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                <span className="text-xl">📸</span> Add Receipt / Expense
              </button>
            ) : (
              <div className="glass-card p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">New Expense</h3>
                  <button onClick={resetExpenseForm} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 text-xl">&times;</button>
                </div>

                {/* Receipt Capture */}
                <div className="mb-4">
                  {!receiptPreview ? (
                    <div className="flex gap-3">
                      <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all">
                        <span className="text-3xl mb-2">📷</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Take Photo</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} className="hidden" />
                      </label>
                      <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <span className="text-3xl mb-2">📁</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Upload</span>
                        <input type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={receiptPreview} alt="Receipt preview" className="w-full h-48 object-cover rounded-xl" />
                      <button
                        onClick={clearReceipt}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                      >✕</button>
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.type}
                        onClick={() => setExpenseForm({ ...expenseForm, category: cat.type })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${expenseForm.category === cat.type
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                          }`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount & Description */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300 font-medium">Amount</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-3 border rounded-lg text-lg font-semibold"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300 font-medium">Description</label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="What was it for?"
                      className="w-full p-3 border rounded-lg mt-1"
                    />
                  </div>
                </div>

                {/* Paid By */}
                <div className="mb-4">
                  <label className="text-sm text-gray-600 dark:text-gray-300 font-medium">Paid by</label>
                  <select
                    value={expenseForm.payerId}
                    onChange={e => setExpenseForm({ ...expenseForm, payerId: e.target.value })}
                    className="w-full p-3 border rounded-lg mt-1"
                  >
                    <option value="">Select who paid...</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.id === currentUser?.id ? ' (You)' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Split With */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300 font-medium">Split with</label>
                    <button
                      onClick={() => setExpenseForm({
                        ...expenseForm,
                        splitWith: expenseForm.splitWith.length === players.length ? [] : players.map(p => p.id)
                      })}
                      className="text-xs text-green-600 font-medium"
                    >
                      {expenseForm.splitWith.length === players.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {players.map(player => (
                      <button
                        key={player.id}
                        onClick={() => {
                          const isSelected = expenseForm.splitWith.includes(player.id);
                          setExpenseForm({
                            ...expenseForm,
                            splitWith: isSelected
                              ? expenseForm.splitWith.filter(id => id !== player.id)
                              : [...expenseForm.splitWith, player.id]
                          });
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${expenseForm.splitWith.includes(player.id)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        {player.name}{player.id === currentUser?.id ? ' (You)' : ''}
                      </button>
                    ))}
                  </div>
                  {expenseForm.splitWith.length > 0 && expenseForm.amount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
                      💡 Each person pays: <span className="font-semibold">${(parseFloat(expenseForm.amount) / expenseForm.splitWith.length).toFixed(2)}</span>
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={saveExpense}
                  disabled={expenseUploading || !expenseForm.description || !expenseForm.amount || !expenseForm.payerId || expenseForm.splitWith.length === 0}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                >
                  {expenseUploading ? '⏳ Saving...' : '✓ Add Expense'}
                </button>
              </div>
            )}

            {/* Settlement Summary */}
            {expenses.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl shadow border border-amber-200">
                <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <span>💸</span> Settlement Summary
                </h3>
                {calculateSettlements().length === 0 ? (
                  <p className="text-amber-700 text-sm">✓ All settled up! No payments needed.</p>
                ) : (
                  <div className="space-y-2">
                    {calculateSettlements().map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          {getPlayerAvatar(s.from) ? (
                            <img src={getPlayerAvatar(s.from)} alt={getPlayerName(s.from)} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                              {getPlayerName(s.from).charAt(0)}
                            </span>
                          )}
                          <span className="text-gray-600 dark:text-gray-300">→</span>
                          {getPlayerAvatar(s.to) ? (
                            <img src={getPlayerAvatar(s.to)} alt={getPlayerName(s.to)} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                              {getPlayerName(s.to).charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{getPlayerName(s.from)} pays {getPlayerName(s.to)}</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">${s.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expense List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h3 className="font-bold">Recent Expenses</h3>
              </div>
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                  <span className="text-4xl block mb-2">🧾</span>
                  <p>No expenses yet. Add your first receipt!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {expenses.map(expense => (
                    <div key={expense.id} className="p-4 hover:bg-gray-50 dark:bg-gray-700 transition-colors">
                      <div className="flex gap-3">
                        {expense.receiptUrl ? (
                          <img
                            src={expense.receiptUrl}
                            alt="Receipt"
                            className="w-16 h-16 object-cover rounded-lg shadow"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                            {getCategoryIcon(expense.category)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{expense.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                Paid by {getPlayerName(expense.payerId)} • Split {expense.splits.length} way{expense.splits.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">${expense.amount.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex -space-x-2">
                              {expense.splits.slice(0, 4).map(split => (
                                getPlayerAvatar(split.playerId) ? (
                                  <img
                                    key={split.playerId}
                                    src={getPlayerAvatar(split.playerId)}
                                    alt={getPlayerName(split.playerId)}
                                    className="w-6 h-6 rounded-full object-cover border-2 border-white"
                                    title={getPlayerName(split.playerId)}
                                  />
                                ) : (
                                  <span
                                    key={split.playerId}
                                    className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border-2 border-white"
                                    title={getPlayerName(split.playerId)}
                                  >
                                    {getPlayerName(split.playerId).charAt(0)}
                                  </span>
                                )
                              ))}
                              {expense.splits.length > 4 && (
                                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold border-2 border-white">
                                  +{expense.splits.length - 4}
                                </span>
                              )}
                            </div>
                            {expense.payerId === currentUser?.id && (
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Save Bar - Shows when editing profile */}
      {editingPlayerId && (
        <div className="fixed bottom-20 left-0 right-0 z-[60] bg-white dark:bg-slate-800 border-t-2 border-emerald-400 px-4 py-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex gap-3">
            <button onClick={() => { alert('Save button clicked!'); saveProfile(); }} className="btn-primary flex-1 py-4 text-lg font-bold">💾 Save Profile</button>
            <button onClick={cancelEditProfile} className="btn-secondary px-6 py-4">Cancel</button>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200 dark:border-slate-600/50 safe-bottom">
        <div className="max-w-4xl mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            {navItems.map(item => {
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setCurrentView(item.key)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 tap-target ${isActive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span className={`text-xl mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
