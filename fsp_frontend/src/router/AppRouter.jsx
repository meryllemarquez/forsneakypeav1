import { createBrowserRouter } from 'react-router-dom';
import WelcomePage from '../pages/Welcome/WelcomePage';
import ProtectedRoute from '../components/common/ProtectedRoute/ProtectedRoute';
import Layout from '../components/layout/Layout/Layout';
import MockPage from '../components/common/MockPage/MockPage';

export const router = createBrowserRouter([
  {
    path: '/welcome',
    element: <WelcomePage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: (
          <Layout>
            <MockPage title="Our Story Timeline" />
          </Layout>
        )
      },
      {
        path: '/memories',
        element: (
          <Layout>
            <MockPage title="Our Precious Memories" />
          </Layout>
        )
      },
      {
        path: '/adventures',
        element: (
          <Layout>
            <MockPage title="Our Adventures" />
          </Layout>
        )
      }
    ]
  }
]);