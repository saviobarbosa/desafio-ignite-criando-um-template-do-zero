import format from 'date-fns/format';
import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';

import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

// import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  function getReadingTime() {
    const content = post.data.content.reduce((text, cont) => {
      text += `${cont.heading}`;

      const body = RichText.asText(cont.body);

      text += body;

      return text;
    }, '');

    const wordCount = content.split(/\s/).length;

    return Math.ceil(wordCount / 200);
  }

  if (isFallback) {
    return (
      <h1>Carregando...</h1>
    )
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Ignews</title>
      </Head>

      <Header />

      <img className={styles.banner} src={post.data.banner.url} alt=""/>

      <main>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <time>
              <FiCalendar size={16} />
              {post.first_publication_date}
            </time>
            <span><FiUser size={16} />{post.data.author}</span>
            <span><FiClock size={16} />{getReadingTime()} min</span>
          </div>

          {post.data.content.map((content, index) => (
            <section key={index}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 1, fetch: ['posts.uid']}
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid }}));

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const content = response.data.content.map(cont => ({
    heading: cont.heading,
    body: cont.body
  }));

  const post = {
    uid: response.uid,
    first_publication_date: format(new Date(response.first_publication_date), 'd MMM y'),
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content
    },
  }

  return {
    props: {
      post
    }
  }
};
