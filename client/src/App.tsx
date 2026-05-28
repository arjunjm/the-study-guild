import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/layout/AppShell';

// Eagerly load login and shell; lazy-load everything behind auth
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const HomePage         = lazy(() => import('./pages/HomePage'));
const CoursesPage      = lazy(() => import('./pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const LessonPage       = lazy(() => import('./pages/LessonPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const AuthoringAssistantPage = lazy(() => import('./pages/AuthoringAssistantPage'));
const CourseEditorPage  = lazy(() => import('./pages/CourseEditorPage'));
const LessonEditorPage  = lazy(() => import('./pages/LessonEditorPage'));
const LeaderboardPage   = lazy(() => import('./pages/LeaderboardPage'));
const NotesPage        = lazy(() => import('./pages/NotesPage'));
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex min-h-full items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<HomePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:courseId" element={<CourseDetailPage />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<LessonPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="teach" element={<TeacherDashboard />} />
            <Route path="teach/assistant" element={<AuthoringAssistantPage />} />
            <Route path="teach/courses/:courseId/edit" element={<CourseEditorPage />} />
            <Route path="teach/courses/:courseId/lessons/:lessonId/edit" element={<LessonEditorPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
