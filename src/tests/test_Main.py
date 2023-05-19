import string
from unittest import TestCase

from main import shorten


class MainTest(TestCase):
    def test_shorten(self):
        # Тестируем сокращение строки, в которой меньше 70 символов
        s = 'Название'
        actual = shorten(s)
        expected = 'Название'
        self.assertEqual(first=actual, second=expected)

        # Тестируем сокращение строки, в которой больше 70 символов,
        # но меньше 85 символов
        s = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc'
            'defghijklmnopqrs'
        )
        actual = shorten(s)
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
        actual = shorten(s)
        expected = (
            'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabc...'
            'hijklmnopqrstuv'
        )
        self.assertEqual(first=actual, second=expected)
