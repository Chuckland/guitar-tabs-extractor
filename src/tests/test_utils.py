from unittest import TestCase

from utils import shorten


class UtilsTest(TestCase):
    def test_shorten(self):
        # Тестируем сокращение строки, в которой меньше 70 символов
        s = 'Название'
        actual = shorten(s=s, max_len=70)
        expected = 'Название'
        self.assertEqual(first=actual, second=expected)

        # Тестируем сокращение строки, в которой больше 70 символов,
        # но меньше 85 символов
        s = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc'
            'defghijklmnopqrs'
        )
        actual = shorten(s=s, max_len=70)
        expected = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc...'
            'efghijklmnopqrs'
        )
        self.assertEqual(first=actual, second=expected)

        # Тестируем сокращение строки, в которой больше 85 символов
        s = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcd'
            'efghijklmnopqrstuvwxyzabcdefghijklmnopqrstuv'
        )
        actual = shorten(s=s, max_len=70)
        expected = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc...'
            'hijklmnopqrstuv'
        )
        self.assertEqual(first=actual, second=expected)
