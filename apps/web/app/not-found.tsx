import Link from 'next/link';
import { Button } from '@repo/ui/components/ui/button';
import { Textarea } from '@repo/ui/components/ui/textarea';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <article className={styles.info}>
        <div className={styles.header}>
          <Textarea className={styles.title}>404</Textarea>
          <Textarea className={styles.desc}>Page Not Found</Textarea>
        </div>
        <div className={styles.body}>
          <Button className={styles.button} variant="secondary" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
