import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { VersionGuard } from '@/components/system/VersionGuard';
import { LandingPage } from '@/pages/LandingPage';
import { JoinPage } from '@/pages/JoinPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { CreateRoomPage } from '@/pages/CreateRoomPage';
import { LobbyPage } from '@/pages/LobbyPage';
import { HostPage } from '@/pages/HostPage';

export default function App() {
  return (
    <VersionGuard>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/create" element={<CreateRoomPage />} />
          <Route path="/lobby/:code" element={<LobbyPage />} />
          <Route path="/host/:code" element={<HostPage />} />
        </Routes>
      </BrowserRouter>
    </VersionGuard>
  );
}
