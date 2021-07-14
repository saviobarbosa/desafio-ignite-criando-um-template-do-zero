import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import { useEffect, useRef, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
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
  const [otherPost, setOtherPost] = useState([] as Post[]);

  function loadPosts() {
    const myHeaders = new Headers();

    const myInit = {
      method: 'GET',
      headers: myHeaders,
    };

    if (nextPage) {
      fetch(nextPage, myInit)
        .then(response => response.json())
        .then(data => {
          const posts = data.results.map(post => {
            return {
              uid: post.uid,
              first_publication_date: format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                { locale: ptBR }
              ),
              data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author: post.data.author,
              },
            };
          });

          setOtherPost([...otherPost, ...posts]);
          setNextPage(data.next_page);
        });
    }
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.post}>
          {postsPagination.results.map(post => {
            const formatedDate = format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            );

            return (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <section>
                    <div>
                      <FiCalendar size="1.25rem" className={styles.icon} />
                      <time>{formatedDate}</time>
                    </div>
                    <div>
                      <FiUser size="1.25rem" className={styles.icon} />
                      <p>{post.data.author}</p>
                    </div>
                  </section>
                </a>
              </Link>
            );
          })}

          {otherPost.length > 0 ? (
            otherPost.map(post => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <section>
                    <div>
                      <FiCalendar size="1.25rem" className={styles.icon} />
                      <time>{post.first_publication_date}</time>
                    </div>
                    <div>
                      <FiUser size="1.25rem" className={styles.icon} />
                      <p>{post.data.author}</p>
                    </div>
                  </section>
                </a>
              </Link>
            ))
          ) : (
            <></>
          )}

          {nextPage ? (
            <button onClick={loadPosts}>Carregar mais posts</button>
          ) : (
            <></>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // TODO
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60, // 1 hour
  };
};
