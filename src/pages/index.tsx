import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import Link from 'next/link';

import { format } from 'date-fns';
import Head from 'next/head';
import { useState } from 'react';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [post, setPost] = useState<Post[]>(postsPagination.results);

  async function handleLoadPosts() {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => {
        const newPost = data.results.map(postResult => ({
          uid: postResult.uid,
          first_publication_date: format(new Date(postResult.first_publication_date), 'd MMM y'),
          data: postResult.data,
        }));

        setPost([...post, ...newPost]);
        setNextPage(data.nextPage);
    });
  }

  return (
    <>
      <Head>
        <title>Home | space-traveling</title>
      </Head>

      <Header />

      <main>
        <div className={styles.post}>
          { post.map((result, index) => (
            <Link href={`/post/${result.uid}`} key={result.uid ?? index}>
              <a>
                <h1>{result.data.title}</h1>
                <strong>{result.data.subtitle}</strong>
                <section>
                    <div>
                      <FiCalendar size="1.25rem" className={styles.icon} />
                      <time>{result.first_publication_date}</time>
                    </div>
                    <div>
                      <FiUser size="1.25rem" className={styles.icon} />
                      <p>{result.data.author}</p>
                    </div>
                  </section>
              </a>
            </Link>
          ))}

          {
            !!nextPage &&
            <button
              type="button"
              onClick={handleLoadPosts}>
                Carregar mais posts
              </button>
          }
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(new Date(post.first_publication_date), 'd MMM y'),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }
    }
  }
};
